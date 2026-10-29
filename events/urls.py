from django.urls import path
from .views import EventListView, EventCreateView, RegisterForEventView,MyRegistrationsView

urlpatterns = [
    path('', EventListView.as_view(), name='event-list'),
     path('create/', EventCreateView.as_view(), name='event-create'),
     path('register/', RegisterForEventView.as_view(), name='event-register'),
     path("my-registrations/", MyRegistrationsView.as_view(), name="my-registrations"),

]