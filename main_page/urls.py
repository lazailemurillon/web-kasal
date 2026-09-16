from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='main_page'),
    path('reservations/',views.reservation_page,name='reservations'),
    path('book/<int:gown_id>/',views.booking_page,name='booking'),
    path("staff/", views.staff_admin, name="staff_admin"),
    path('staff/<int:staff_id>/update/',views.update_staff,name='update_staff'),
    path('staff/<int:staff_id>/delete/',views.delete_staff,name='delete_staff'),
    path("staff/gowns/<int:gown_id>/delete/",views.delete_gown,name="delete_gown"),
    path("api/find-similar-gowns/",views.find_similar_gowns_view,name="find_similar_gowns"),
    path('booking/<int:gown_id>/', views.booking, name='booking'),
]