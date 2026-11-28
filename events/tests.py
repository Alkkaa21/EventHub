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

    # 9. Capacity and remaining-seat calculations in the event list response.
    def test_event_list_capacity_and_remaining_seats(self):
        # future_event has capacity=1, initially registered_count=0, spots_left=1
        response = self.client.get("/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        target = next(
            (e for e in response.data if e["id"] == self.future_event.id), None
        )
        self.assertIsNotNone(target)
        self.assertEqual(target["registered_count"], 0)
        self.assertEqual(target["spots_left"], 1)

        # Register user1 for future_event
        Registration.objects.create(user=self.user1, event=self.future_event)

        response2 = self.client.get("/events/")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        target2 = next(
            (e for e in response2.data if e["id"] == self.future_event.id), None
        )
        self.assertEqual(target2["registered_count"], 1)
        self.assertEqual(target2["spots_left"], 0)

    # 10. Query count remains constant (no N+1 queries) as events scale.
    def test_event_list_constant_queries(self):
        # Warmup or baseline query count with 2 events
        with self.assertNumQueries(1):
            response = self.client.get("/events/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create 10 more events and some registrations
        tomorrow = timezone.now().date() + timedelta(days=5)
        for i in range(10):
            ev = Event.objects.create(
                creator=self.user1,
                title=f"Batch Event {i}",
                description="desc",
                date=tomorrow,
                time=time(11, 0),
                venue="Hall",
                capacity=5,
                price=0,
            )
            Registration.objects.create(user=self.user1, event=ev)

        # Query count must remain exactly 1 despite having 12 events
        with self.assertNumQueries(1):
            response = self.client.get("/events/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data), 12)

    # 11. Successful cancellation returns 204 and frees up the seat.
    def test_cancel_registration_success(self):
        reg = Registration.objects.create(user=self.user1, event=self.future_event)
        self.client.force_authenticate(user=self.user1)

        response = self.client.delete(f"/events/registrations/{reg.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Registration.objects.filter(id=reg.id).exists())

        # Verification that the freed seat becomes available
        list_response = self.client.get("/events/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        target = next(
            (e for e in list_response.data if e["id"] == self.future_event.id), None
        )
        self.assertEqual(target["registered_count"], 0)
        self.assertEqual(target["spots_left"], 1)

    # 12. Cancellation by a different user returns 404.
    def test_cancel_registration_by_different_user_returns_404(self):
        reg = Registration.objects.create(user=self.user1, event=self.future_event)
        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(f"/events/registrations/{reg.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Registration.objects.filter(id=reg.id).exists())

    # 13. Cancellation after the event has started returns 400.
    def test_cancel_registration_after_event_started_returns_400(self):
        reg = Registration.objects.create(user=self.user1, event=self.past_event)
        self.client.force_authenticate(user=self.user1)

        response = self.client.delete(f"/events/registrations/{reg.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("started", str(response.data))
        self.assertTrue(Registration.objects.filter(id=reg.id).exists())

    # 14. Cancellation of a nonexistent registration returns 404.
    def test_cancel_nonexistent_registration_returns_404(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete("/events/registrations/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # 15. Unauthenticated user cannot cancel registration.
    def test_cancel_registration_unauthenticated_returns_401(self):
        reg = Registration.objects.create(user=self.user1, event=self.future_event)
        response = self.client.delete(f"/events/registrations/{reg.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

