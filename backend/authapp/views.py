from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status


@api_view(["POST"])
def register_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return JsonResponse({"error": "Missing fields"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already taken"}, status=400)

    user = User.objects.create_user(username=username, password=password)
    login(request, user)  # direkt einloggen
    return JsonResponse({"message": "User registered"})


@api_view(["POST"])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"message": "Login successful"})
    else:
        return JsonResponse({"error": "Invalid credentials"}, status=400)


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out"})


@api_view(["GET"])
def session_view(request):
    if request.user.is_authenticated:
        # Gruppen des Users abrufen
        groups = list(request.user.groups.values_list("name", flat=True))
        return JsonResponse({
            "isAuthenticated": True,
            "username": request.user.username,
            "groups": groups
        })
    return JsonResponse({"isAuthenticated": False, "groups": []})
