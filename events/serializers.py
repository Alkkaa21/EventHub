from rest_framework import serializers
from .models import Event, Registration


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['creator']

class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(
        source="event.title",
        read_only=True
    )
    event_date = serializers.DateField(
        source="event.date",
        read_only=True
    )
    event_venue = serializers.CharField(
        source="event.venue",
        read_only=True
    )

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
        event = data["event"]

        if Registration.objects.filter(
            user=self.context["request"].user,
            event=event
        ).exists():
            raise serializers.ValidationError(
                "You are already registered for this event."
            )

        return data