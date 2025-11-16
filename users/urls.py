from django.urls import path
from .views import RegisterView, PhoneLoginView, MeView, UserDeleteView, LogoutView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", PhoneLoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("users/<int:user_id>/delete/", UserDeleteView.as_view(), name="user_delete"),
    path("logout/", LogoutView.as_view(), name="logout"),
]