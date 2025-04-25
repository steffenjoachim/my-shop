from django.http import HttpResponse

def home(request):
    return HttpResponse("Willkommen auf meiner Django-Seite!")