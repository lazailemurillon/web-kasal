from django.shortcuts import render, redirect, get_object_or_404
from .models import Gown, CustomerProfile, StaffProfile, Reservation
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .fashionclip_service import find_similar_gowns
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .fashion_api_client import get_fashion_embedding

# Create your views here.

#main page
def main_page(request):

    gowns = Gown.objects.all()

    return render(
        request,
        'main_page.html',
        {
            'gowns': gowns,
            'color_choices': Gown.COLOR_CHOICES,
            'style_choices': Gown.STYLE_CHOICES,
            'size_choices': Gown.SIZE_CHOICES,
        }
    )
#RESERVATION LIST
@login_required
def reservation_page(request):

    # Get ONLY the currently logged-in user's reservations
    reservations = Reservation.objects.filter(
        user=request.user
    ).select_related(
        'gown'
    ).order_by(
        'date',
        'created_at'
    )

    # Confirmed reservations = Upcoming
    upcoming_reservations = reservations.filter(
        status='confirmed'
    )

    # Completed reservations = Past Rentals
    past_reservations = reservations.filter(
        status='completed'
    )

    return render(
        request,
        'reservation_page.html',
        {
            'upcoming_reservations': upcoming_reservations,
            'past_reservations': past_reservations,
        }
    )
@login_required
@require_POST
def cancel_reservation(request, reservation_id):

    reservation = get_object_or_404(
        Reservation,
        id=reservation_id,
        user=request.user
    )

    # Only confirmed reservations can be cancelled
    if reservation.status != "confirmed":

        return JsonResponse(
            {
                "success": False,
                "error": "This reservation cannot be cancelled."
            },
            status=400
        )

    # --------------------------------
    # CANCEL RESERVATION
    # --------------------------------

    reservation.status = "cancelled"
    reservation.save(update_fields=["status"])

    # --------------------------------
    # MAKE GOWN AVAILABLE AGAIN
    # --------------------------------

    gown = reservation.gown

    # Check if the gown has another active reservation
    other_active_reservation = Reservation.objects.filter(
        gown=gown,
        status="confirmed"
    ).exclude(
        id=reservation.id
    ).exists()

    if not other_active_reservation:

        gown.is_reserved = False
        gown.save(update_fields=["is_reserved"])

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return JsonResponse({
        "success": True,
        "message": "Reservation cancelled successfully."
    })



def booking_page(request, gown_id):
    gown = Gown.objects.get(id=gown_id)

    return render(
        request,
        'booking_page.html',
        {
            'gown': gown,
        }
    )

#signup
def signup(request):

    if request.method == 'POST':

        account_type = request.POST.get('account_type')

        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip().lower()

        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # -----------------------------
        # BASIC VALIDATION
        # -----------------------------

        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return redirect('signup')

        if User.objects.filter(username=email).exists():
            messages.error(
                request,
                'An account with this email already exists.'
            )
            return redirect('signup')

        # -----------------------------
        # CUSTOMER
        # -----------------------------

        if account_type == 'customer':

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            CustomerProfile.objects.create(
                user=user
            )

        # -----------------------------
        # STAFF
        # -----------------------------

        elif account_type == 'staff':

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            user.is_staff = True
            user.save()

            # --------------------------------
            # STAFF STATUS
            # --------------------------------
            # First staff account = verified
            # All later staff accounts = pending

            if StaffProfile.objects.exists():
                staff_status = 'pending'
            else:
                staff_status = 'verified'

            StaffProfile.objects.create(
                user=user,
                status=staff_status
            )


        # -----------------------------
        # INVALID ACCOUNT TYPE
        # -----------------------------

        else:

            messages.error(
                request,
                'Invalid account type.'
            )

            return redirect('signup')

        # Automatically log them in
        login(request, user)

        if account_type == 'staff':
            return redirect('staff_admin')

        return redirect('main_page')

    return render(request, 'signup.html')



#admin
@login_required
def staff_admin(request):

    if not request.user.is_staff:
        return redirect('main_page')

    # ----------------------------------------
    # GET ALL GOWNS
    # ----------------------------------------

    gowns = Gown.objects.all().order_by('-created_at')


    # ----------------------------------------
    # GET ALL STAFF
    # ----------------------------------------

    staff_members = StaffProfile.objects.select_related(
        'user'
    ).all().order_by(
        'user__first_name',
        'user__last_name'
    )


    # ----------------------------------------
    # GET ALL RESERVATIONS
    # ----------------------------------------

    reservations = Reservation.objects.select_related(
        'user',
        'gown'
    ).all().order_by(
        '-date',
        '-created_at'
    )


    # ----------------------------------------
    # SEND EVERYTHING TO TEMPLATE
    # ----------------------------------------

    return render(
        request,
        'staff.html',
        {
            'gowns': gowns,

            'staff_members': staff_members,

            'reservations': reservations,

            'color_choices': Gown.COLOR_CHOICES,
            'style_choices': Gown.STYLE_CHOICES,
            'size_choices': Gown.SIZE_CHOICES,
        }
    )


#login
def login_user(request):

    if request.method == 'POST':

        email = request.POST.get('username', '').strip().lower()
        password = request.POST.get('password')

        user = authenticate(
            request,
            username=email,
            password=password
        )

        # --------------------------------
        # INVALID LOGIN
        # --------------------------------

        if user is None:

            return render(
                request,
                'login.html',
                {
                    'login_error': 'Invalid email or password.'
                }
            )

        # --------------------------------
        # STAFF STATUS CHECK
        # --------------------------------

        if user.is_staff:

            try:
                staff_profile = user.staff_profile

            except StaffProfile.DoesNotExist:

                return render(
                    request,
                    'login.html',
                    {
                        'login_error': 'Staff account information was not found.'
                    }
                )

            # Pending staff cannot log in
            if staff_profile.status == 'pending':

                return render(
                    request,
                    'login.html',
                    {
                        'login_error': (
                            'Your staff account is still pending. '
                            'Please wait until your status has been verified '
                            'before logging in.'
                        )
                    }
                )

            # Only verified staff can continue
            if staff_profile.status != 'verified':

                return render(
                    request,
                    'login.html',
                    {
                        'login_error': (
                            'Your staff account has not been verified yet.'
                        )
                    }
                )

        # --------------------------------
        # LOGIN
        # --------------------------------

        login(request, user)

        # --------------------------------
        # STAFF
        # --------------------------------

        if user.is_staff:
            return redirect('staff_admin')

        # --------------------------------
        # CUSTOMER
        # --------------------------------

        return redirect('main_page')

    return render(request, 'login.html')


#admin
@login_required
@require_POST
def update_staff(request, staff_id):

    if not request.user.is_staff:
        return JsonResponse(
            {
                'success': False,
                'error': 'Unauthorized.'
            },
            status=403
        )

    try:
        staff = StaffProfile.objects.select_related('user').get(
            id=staff_id
        )
    except StaffProfile.DoesNotExist:
        return JsonResponse(
            {
                'success': False,
                'error': 'Staff member not found.'
            },
            status=404
        )

    name = request.POST.get('name', '').strip()
    email = request.POST.get('email', '').strip().lower()
    status = request.POST.get('status', '').strip().lower()

    # -----------------------------
    # VALIDATION
    # -----------------------------

    if not name:
        return JsonResponse(
            {
                'success': False,
                'error': 'Name is required.'
            },
            status=400
        )

    if not email:
        return JsonResponse(
            {
                'success': False,
                'error': 'Email is required.'
            },
            status=400
        )

    if status not in ['pending', 'verified']:
        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid staff status.'
            },
            status=400
        )

    # -----------------------------
    # CHECK EMAIL
    # -----------------------------

    if User.objects.filter(
        username=email
    ).exclude(
        id=staff.user.id
    ).exists():

        return JsonResponse(
            {
                'success': False,
                'error': 'That email is already being used.'
            },
            status=400
        )

    # -----------------------------
    # SPLIT NAME
    # -----------------------------

    name_parts = name.split(maxsplit=1)

    first_name = name_parts[0]
    last_name = (
        name_parts[1]
        if len(name_parts) > 1
        else ''
    )

    # -----------------------------
    # UPDATE USER
    # -----------------------------

    staff.user.first_name = first_name
    staff.user.last_name = last_name
    staff.user.email = email
    staff.user.username = email

    staff.user.save()

    # -----------------------------
    # UPDATE STAFF PROFILE
    # -----------------------------

    staff.status = status
    staff.save()

    # -----------------------------
    # RETURN UPDATED DATA
    # -----------------------------

    return JsonResponse({
        'success': True,
        'staff': {
            'id': staff.id,
            'name': staff.user.get_full_name(),
            'email': staff.user.email,
            'status': staff.status,
            'status_display': staff.get_status_display(),
        }
    })
@login_required
@require_POST
def delete_staff(request, staff_id):

    if not request.user.is_staff:
        return JsonResponse(
            {
                'success': False,
                'error': 'Unauthorized.'
            },
            status=403
        )

    try:
        staff = StaffProfile.objects.select_related('user').get(
            id=staff_id
        )
    except StaffProfile.DoesNotExist:
        return JsonResponse(
            {
                'success': False,
                'error': 'Staff member not found.'
            },
            status=404
        )

    user = staff.user

    # Delete the User.
    # StaffProfile will also be deleted because
    # user has OneToOneField(... on_delete=CASCADE)
    user.delete()

    return JsonResponse({
        'success': True
    })


#gown
@login_required
@require_POST
def create_gown(request):

    if not request.user.is_staff:
        return JsonResponse(
            {
                'success': False,
                'error': 'Unauthorized.'
            },
            status=403
        )

    name = request.POST.get('name', '').strip()
    price = request.POST.get('price', '').strip()
    color = request.POST.get('color', '').strip()
    style = request.POST.get('style', '').strip()
    size = request.POST.get('size', '').strip()
    image = request.FILES.get('image')


    # --------------------------------
    # VALIDATION
    # --------------------------------

    if not name:
        return JsonResponse(
            {
                'success': False,
                'error': 'Gown name is required.'
            },
            status=400
        )


    if not price:
        return JsonResponse(
            {
                'success': False,
                'error': 'Gown price is required.'
            },
            status=400
        )


    if not image:
        return JsonResponse(
            {
                'success': False,
                'error': 'Gown image is required.'
            },
            status=400
        )


    if color not in dict(Gown.COLOR_CHOICES):
        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown color.'
            },
            status=400
        )


    if style not in dict(Gown.STYLE_CHOICES):
        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown style.'
            },
            status=400
        )


    if size not in dict(Gown.SIZE_CHOICES):
        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown size.'
            },
            status=400
        )


    # --------------------------------
    # CREATE GOWN
    # --------------------------------

    # --------------------------------
    # GET FASHIONCLIP EMBEDDING FROM API
    # --------------------------------

    try:

        ai_result = get_fashion_embedding(
            image
        )

    except Exception as e:

        print("FashionCLIP API error:", e)

        return JsonResponse(
            {
                "success": False,
                "error": "Unable to process the gown image with the AI service."
            },
            status=500
        )


    fashion_embedding = ai_result["embedding"]
    color_histogram = ai_result["color"]


    # --------------------------------
    # CREATE GOWN
    # --------------------------------

    try:

        gown = Gown.objects.create(
            name=name,
            price=price,
            color=color,
            style=style,
            size=size,
            image=image,
            fashion_embedding=fashion_embedding,
            color_histogram=color_histogram
        )

    except Exception as e:

        return JsonResponse(
            {
                "success": False,
                "error": str(e)
            },
            status=400
        )

        return JsonResponse(
            {
                'success': False,
                'error': str(e)
            },
            status=400
        )


    # --------------------------------
    # SUCCESS
    # --------------------------------

    return JsonResponse({
        'success': True,
        'gown': {
            'id': gown.id,
            'name': gown.name,
            'price': str(gown.price),
            'color': gown.color,
            'style': gown.style,
            'size': gown.size,
            'image': gown.image.url if gown.image else None,
        }
    })
@login_required
@require_POST
def update_gown(request, gown_id):

    if not request.user.is_staff:
        return JsonResponse(
            {
                'success': False,
                'error': 'Unauthorized.'
            },
            status=403
        )


    try:

        gown = Gown.objects.get(
            id=gown_id
        )

    except Gown.DoesNotExist:

        return JsonResponse(
            {
                'success': False,
                'error': 'Gown not found.'
            },
            status=404
        )


    name = request.POST.get(
        'name',
        ''
    ).strip()

    price = request.POST.get(
        'price',
        ''
    ).strip()

    color = request.POST.get(
        'color',
        ''
    ).strip()

    style = request.POST.get(
        'style',
        ''
    ).strip()

    size = request.POST.get(
        'size',
        ''
    ).strip()

    image = request.FILES.get(
        'image'
    )


    # --------------------------------
    # VALIDATION
    # --------------------------------

    if not name:

        return JsonResponse(
            {
                'success': False,
                'error': 'Gown name is required.'
            },
            status=400
        )


    if not price:

        return JsonResponse(
            {
                'success': False,
                'error': 'Gown price is required.'
            },
            status=400
        )


    if color not in dict(
        Gown.COLOR_CHOICES
    ):

        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown color.'
            },
            status=400
        )


    if style not in dict(
        Gown.STYLE_CHOICES
    ):

        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown style.'
            },
            status=400
        )


    if size not in dict(
        Gown.SIZE_CHOICES
    ):

        return JsonResponse(
            {
                'success': False,
                'error': 'Invalid gown size.'
            },
            status=400
        )


    # --------------------------------
    # UPDATE
    # --------------------------------

    gown.name = name
    gown.price = price
    gown.color = color
    gown.style = style
    gown.size = size


    # --------------------------------
    # UPDATE IMAGE + AI EMBEDDING
    # --------------------------------

    if image:

        try:

            ai_result = get_fashion_embedding(
                image
            )

        except Exception as e:

            print(
                "FashionCLIP API error:",
                e
            )

            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Unable to process the new gown image "
                        "with the AI service."
                    )
                },
                status=500
            )

        gown.image = image

        gown.fashion_embedding = (
            ai_result["embedding"]
        )

        gown.color_histogram = (
            ai_result["color"]
        )


    # --------------------------------
    # SAVE
    # --------------------------------

    gown.save()


    # --------------------------------
    # RETURN UPDATED GOWN
    # --------------------------------

    return JsonResponse({
        'success': True,

        'gown': {
            'id': gown.id,
            'name': gown.name,
            'price': str(gown.price),
            'color': gown.color,
            'color_display': gown.get_color_display(),
            'style': gown.style,
            'style_display': gown.get_style_display(),
            'size': gown.size,
            'image': (
                gown.image.url
                if gown.image
                else None
            ),
        }
    })
@require_POST
def delete_gown(request, gown_id):
    gown = get_object_or_404(Gown, id=gown_id)
    gown.delete()
    return JsonResponse({
        "success": True
    })



#AI
# ============================================================
# FIND SIMILAR GOWNS USING FASHIONCLIP
# ============================================================

@require_POST
def find_similar_gowns_view(request):

    # --------------------------------------------------------
    # Make sure a photo was uploaded
    # --------------------------------------------------------

    uploaded_file = request.FILES.get("photo")

    if not uploaded_file:
        return JsonResponse(
            {
                "success": False,
                "error": "No photo was uploaded."
            },
            status=400
        )

    # --------------------------------------------------------
    # Check file type
    # --------------------------------------------------------

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if uploaded_file.content_type not in allowed_types:

        return JsonResponse(
            {
                "success": False,
                "error": "Please upload a JPG, PNG, or WEBP image."
            },
            status=400
        )

    # --------------------------------------------------------
    # Get gowns from database
    # --------------------------------------------------------

    gowns = Gown.objects.filter(
        is_reserved=False
    )

    # --------------------------------------------------------
    # Run FashionCLIP
    # --------------------------------------------------------

    try:

        results = find_similar_gowns(
            uploaded_file=uploaded_file,
            gowns=gowns,
            top_k=12
        )

    except Exception as e:

        print("FashionCLIP error:", e)

        return JsonResponse(
            {
                "success": False,
                "error": "Something went wrong while finding similar gowns."
            },
            status=500
        )

    # --------------------------------------------------------
    # Extract gown IDs
    # --------------------------------------------------------

    gown_ids = [
        result["id"]
        for result in results
    ]

    # --------------------------------------------------------
    # Return IDs + similarity scores
    # --------------------------------------------------------
    print("================================")
    print("FASHIONCLIP RESULTS:")
    print(results)
    print("================================")

    return JsonResponse(
        {
            "success": True,
            "gown_ids": gown_ids,
            "results": results
        }
    )

#RESERVATION
@login_required
def booking(request, gown_id):

    gown = get_object_or_404(
        Gown,
        id=gown_id
    )

    time_slots = [
        "9:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "1:00 PM",
        "2:00 PM",
        "3:00 PM",
        "4:00 PM",
        "5:00 PM",
    ]

    if request.method == "POST":

        selected_date = request.POST.get("date")
        selected_time = request.POST.get("time_slot")

        if not selected_date or not selected_time:

            messages.error(
                request,
                "Please select a date and time."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # Convert submitted date
        from datetime import datetime

        try:
            booking_date = datetime.strptime(
                selected_date,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            messages.error(
                request,
                "Invalid date."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # Sunday = closed
        if booking_date.weekday() == 6:

            messages.error(
                request,
                "We are closed on Sundays."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # Don't allow dates in the past
        if booking_date < timezone.localdate():

            messages.error(
                request,
                "You cannot select a past date."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # Make sure selected time is valid
        if selected_time not in time_slots:

            messages.error(
                request,
                "Invalid time slot."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # Check whether this gown is already booked
        already_booked = Reservation.objects.filter(
            gown=gown,
            date=booking_date,
            time_slot=selected_time,
            status__in=["confirmed"]
        ).exists()

        if already_booked:

            messages.error(
                request,
                "This gown is already reserved for that date and time."
            )

            return redirect(
                "booking",
                gown_id=gown.id
            )

        # CREATE RESERVATION
        Reservation.objects.create(
            user=request.user,
            customer_email=request.user.email,
            gown=gown,
            date=booking_date,
            time_slot=selected_time,
            status="confirmed",
            prep="pulled"
        )
        # Mark the gown as reserved
        gown.is_reserved = True
        gown.save(update_fields=["is_reserved"])


        messages.success(
            request,
            "Your reservation has been confirmed."
        )

        return redirect("reservations")

    return render(
        request,
        "booking.html",
        {
            "gown": gown,
            "time_slots": time_slots,
        }
    )


#STAFF UPDATE RESERVATION
@login_required
@require_POST
def update_reservation(request, reservation_id):

    # ----------------------------------------
    # ONLY STAFF CAN EDIT RESERVATIONS
    # ----------------------------------------

    if not request.user.is_staff:

        return JsonResponse(
            {
                "success": False,
                "error": "Unauthorized."
            },
            status=403
        )


    # ----------------------------------------
    # GET RESERVATION
    # ----------------------------------------

    reservation = get_object_or_404(
        Reservation.objects.select_related(
            "gown",
            "user"
        ),
        id=reservation_id
    )


    # ----------------------------------------
    # GET FORM DATA
    # ----------------------------------------

    new_status = request.POST.get(
        "status",
        ""
    ).strip().lower()

    new_prep = request.POST.get(
        "prep",
        ""
    ).strip().lower()


    # ----------------------------------------
    # VALIDATE STATUS
    # ----------------------------------------

    allowed_statuses = [
        "confirmed",
        "completed",
        "cancelled"
    ]

    if new_status not in allowed_statuses:

        return JsonResponse(
            {
                "success": False,
                "error": "Invalid reservation status."
            },
            status=400
        )


    # ----------------------------------------
    # VALIDATE PREP
    # ----------------------------------------

    allowed_prep = [
        "reserved",
        "pulled",
        "ready",
        "cleaned"
    ]

    if new_prep not in allowed_prep:

        return JsonResponse(
            {
                "success": False,
                "error": "Invalid preparation status."
            },
            status=400
        )


    # ----------------------------------------
    # UPDATE DATABASE
    # ----------------------------------------

    reservation.status = new_status
    reservation.prep = new_prep

    reservation.save(
        update_fields=[
            "status",
            "prep"
        ]
    )


    # ----------------------------------------
    # UPDATE GOWN AVAILABILITY
    # ----------------------------------------

    gown = reservation.gown

    if new_status in ["completed", "cancelled"]:

        other_active_reservation = Reservation.objects.filter(
            gown=gown,
            status="confirmed"
        ).exclude(
            id=reservation.id
        ).exists()

        if not other_active_reservation:

            gown.is_reserved = False

            gown.save(
                update_fields=["is_reserved"]
            )


    elif new_status == "confirmed":

        gown.is_reserved = True

        gown.save(
            update_fields=["is_reserved"]
        )


    # ----------------------------------------
    # SEND EMAIL
    # ----------------------------------------

    customer_email = reservation.customer_email

    if customer_email:

        if new_status == "confirmed":

            subject = "Kasal Avenue - Reservation Confirmed"

            message = f"""
Hello {reservation.user.get_full_name() or reservation.user.username},

Your reservation has been confirmed.

Reservation: KASAL-{reservation.id}
Gown: {reservation.gown.name}
Date: {reservation.date}
Time: {reservation.time_slot}

Preparation status: {reservation.get_prep_display()}

Thank you for choosing Kasal Avenue.
"""


        elif new_status == "completed":

            subject = "Kasal Avenue - Rental Completed"

            message = f"""
Hello {reservation.user.get_full_name() or reservation.user.username},

Your rental has been marked as completed.

Reservation: KASAL-{reservation.id}
Gown: {reservation.gown.name}
Date: {reservation.date}
Time: {reservation.time_slot}

Thank you for choosing Kasal Avenue.
"""


        else:

            subject = "Kasal Avenue - Reservation Cancelled"

            message = f"""
Hello {reservation.user.get_full_name() or reservation.user.username},

Your reservation has been cancelled.

Reservation: KASAL-{reservation.id}
Gown: {reservation.gown.name}
Date: {reservation.date}
Time: {reservation.time_slot}

If you have any questions, please contact Kasal Avenue.

Thank you.
"""


        try:

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [customer_email],
                fail_silently=False
            )

        except Exception as e:

            print("EMAIL ERROR:", e)


    # ----------------------------------------
    # RETURN RESULT TO JAVASCRIPT
    # ----------------------------------------

    return JsonResponse(
        {
            "success": True,

            "reservation": {
                "id": reservation.id,
                "status": reservation.status,
                "prep": reservation.prep,
                "status_display": reservation.get_status_display(),
                "prep_display": reservation.get_prep_display(),
            }
        }
    )