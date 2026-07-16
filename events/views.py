from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
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
            serializer.save(
                creator=request.user
            )

            return Response(serializer.data)

        return Response(serializer.errors)
class RegisterForEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegistrationSerializer(
    data=request.data,
    context={"request": request}
)

        if serializer.is_valid():
            serializer.save(user=request.user)

            return Response(serializer.data)

        return Response(serializer.errors)