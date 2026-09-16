"""
URL configuration for web_kasal project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from main_page import views
from main_page.views import signup
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main_page.urls')),
    path('login/', views.login_user, name='login'),
    path('logout/',auth_views.LogoutView.as_view(next_page='main_page'),name='logout'),
    path('signup/', signup, name='signup'),
    path('staff/gowns/create/',views.create_gown,name='create_gown'),
    path('staff/gowns/<int:gown_id>/update/',views.update_gown,name='update_gown'),
    path('reservations/cancel/<int:reservation_id>/',views.cancel_reservation,name='cancel_reservation'),
    path('staff/reservations/<int:reservation_id>/update/',views.update_reservation,name='update_reservation'),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)