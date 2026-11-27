from datetime import date, time, timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from events.models import Event, Registration


class EventHubAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", password="password123"
        )
        self.user2 = User.objects.create_user(
            username="user2", password="password123"
        )
        
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.future_event = Event.objects.create(
            creator=self.user1,
            title="Future Event",
            description="A great event",
            date=tomorrow,
            time=time(10, 0),
            venue="Main Hall",
            capacity=1,
            price=10.00,
        )

        yesterday = timezone.now().date() - timedelta(days=1)
        self.past_event = Event.objects.create(
            creator=self.user1,
            title="Past Event",
            description="An old event",
            date=yesterday,
            time=time(10, 0),
            venue="Old Hall",
            capacity=10,
            price=0.00,
        )

    # 1. Registering for an event returns 201.
    def test_register_for_event_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # 2. Registering twice returns 400 with "You are already registered".
    def test_register_twice_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response1 = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        response2 = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You are already registered", str(response2.data))

    # 3. Registering for a full event (capacity=1, second user) returns 400 with "This event is full."
    def test_register_full_event_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response1 = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.user2)
        response2 = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("This event is full.", str(response2.data))

    # 4. Registering for an event that already started returns 400.
    def test_register_event_already_started_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/events/register/",
            {"event": self.past_event.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 5. Creating an event with capacity=0 or price=-5 returns 400 with messages
    # "Ensure this value is greater than or equal to 1." and "...to 0.".
    def test_create_event_invalid_capacity_and_price(self):
        self.client.force_authenticate(user=self.user1)
        tomorrow = timezone.now().date() + timedelta(days=2)
        response = self.client.post(
            "/events/create/",
            {
                "title": "Invalid Event",
                "description": "Desc",
                "date": str(tomorrow),
                "time": "14:00:00",
                "venue": "Test Venue",
                "capacity": 0,
                "price": -5,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Ensure this value is greater than or equal to 1.",
            str(response.data.get("capacity", "")),
        )
        self.assertIn(
            "Ensure this value is greater than or equal to 0.",
            str(response.data.get("price", "")),
        )

    # 6. Login with a wrong password returns 401; with missing fields returns 400.
    def test_login_wrong_password_returns_401(self):
        response = self.client.post(
            "/accounts/login/",
            {"username": "user1", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        response = self.client.post(
            "/accounts/login/",
            {"username": "user1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 7. POSTing a valid refresh token to the refresh URL returns a new "access".
    def test_refresh_token_returns_new_access(self):
        refresh = RefreshToken.for_user(self.user1)
        response = self.client.post(
            "/accounts/token/refresh/",
            {"refresh": str(refresh)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # 8. Calling the register endpoint without a token returns 401.
    def test_register_without_token_returns_401(self):
        self.client.logout()
        response = self.client.post(
            "/events/register/",
            {"event": self.future_event.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
