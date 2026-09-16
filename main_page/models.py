from django.db import models
from django.contrib.auth.models import User

# Create your models here.

#main page
class Gown(models.Model):

    COLOR_CHOICES = [
        ('champagne', 'Champagne'),
        ('midnight', 'Midnight'),
        ('blush', 'Blush'),
        ('ivory', 'Ivory'),
        ('sage', 'Sage'),
        ('noir', 'Noir'),
        ('dusty_rose', 'Dusty Rose'),
        ('ecru', 'Ecru'),
    ]

    STYLE_CHOICES = [
        ('ballgown', 'Ballgown'),
        ('column', 'Column'),
        ('a_line', 'A-Line'),
        ('mermaid', 'Mermaid'),
    ]

    SIZE_CHOICES = [
        ('XS', 'XS'),
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
    ]

    name = models.CharField(max_length=200)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    color = models.CharField(
        max_length=50,
        choices=COLOR_CHOICES
    )

    style = models.CharField(
        max_length=50,
        choices=STYLE_CHOICES
    )

    size = models.CharField(
        max_length=20,
        choices=SIZE_CHOICES
    )

    image = models.ImageField(
        upload_to='gowns/'
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=5.0
    )

    review_count = models.PositiveIntegerField(
        default=0
    )

    is_reserved = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
#add
    fashion_embedding = models.JSONField(
        null=True,
        blank=True
    )
    color_histogram = models.JSONField(
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name
    
#signup
class CustomerProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='customer_profile'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class StaffProfile(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='staff_profile'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name()
class Reservation(models.Model):

    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PREP_CHOICES = [
        ('pulled', 'Pulled'),
        ('reserved', 'Reserved'),
        ('cleaned', 'Cleaned'),
        ('ready', 'Ready'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    customer_email = models.EmailField()

    gown = models.ForeignKey(
        Gown,
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    date = models.DateField()

    time_slot = models.CharField(
        max_length=20
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='confirmed'
    )

    prep = models.CharField(
        max_length=20,
        choices=PREP_CHOICES,
        default='pulled'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.customer_email} - {self.gown.name} - {self.date} {self.time_slot}"