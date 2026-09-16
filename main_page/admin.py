from django.contrib import admin
from .models import (Gown,CustomerProfile,StaffProfile,)

# Register your models here.
@admin.register(Gown)
class GownAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'price',
        'color',
        'style',
        'size',
        'is_reserved',
    )

    list_filter = (
        'color',
        'style',
        'size',
        'is_reserved',
    )

    search_fields = (
        'name',
    )

#signup
@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):

    list_display = (
        'user',
        'created_at',
    )


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):

    list_display = (
        'user',
        'status',
        'created_at',
    )

    list_filter = (
        'status',
    )

    search_fields = (
        'employee_id',
        'user__first_name',
        'user__last_name',
        'user__email',
    )
