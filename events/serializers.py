from rest_framework import serializers
from .models import Event, Registration


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['creator']
class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = "__all__"
        read_only_fields = ["user"]

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