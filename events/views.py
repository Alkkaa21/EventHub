from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, Registration
from .serializers import EventSerializer, RegistrationSerializer


class EventListView(APIView):
    def get(self, request):
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class EventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EventSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterForEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegistrationSerializer(
            data=request.data,
            context={"request": request},
        )
        # 400 on validation errors, including "This event is full." from
        # validate(). A ValidationError raised in create() during save() is also
        # converted to a 400 by DRF's exception handler.
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyRegistrationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        registrations = Registration.objects.filter(
            user=request.user
        ).select_related("event")

        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)