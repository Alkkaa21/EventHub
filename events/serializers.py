from datetime import datetime

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Event, Registration


class EventSerializer(serializers.ModelSerializer):
    registered_count = serializers.IntegerField(read_only=True, default=0)
    spots_left = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["creator"]


class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_date = serializers.DateField(source="event.date", read_only=True)
    event_venue = serializers.CharField(source="event.venue", read_only=True)

    class Meta:
        model = Registration
        fields = [
            "id",
            "event",
            "event_title",
            "event_date",
            "event_venue",
            "registered_at",
        ]
        read_only_fields = ["id", "registered_at"]

    def validate(self, data):
        """Fast pre-checks. Not race-safe on their own; create() is authoritative."""
        event = data["event"]
        user = self.context["request"].user

        if Registration.objects.filter(user=user, event=event).exists():
            raise serializers.ValidationError(
                "You are already registered for this event."
            )

        event_datetime = timezone.make_aware(
            datetime.combine(event.date, event.time),
            timezone.get_current_timezone(),
        )
        if event_datetime <= timezone.now():
            raise serializers.ValidationError("The event has already started.")

        if Registration.objects.filter(event=event).count() >= event.capacity:
            raise serializers.ValidationError("This event is full.")

        return data

    def create(self, validated_data):
        user = validated_data["user"]
        event_id = validated_data["event"].pk

        try:
            with transaction.atomic():
                event = Event.objects.select_for_update().get(pk=event_id)

                if Registration.objects.filter(event=event).count() >= event.capacity:
                    raise serializers.ValidationError(
                        {"non_field_errors": ["This event is full."]}
                    )

                if Registration.objects.filter(user=user, event=event).exists():
                    raise serializers.ValidationError(
                        {"non_field_errors": ["You are already registered for this event."]}
                    )

                return Registration.objects.create(user=user, event=event)
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["You are already registered for this event."]}
            )