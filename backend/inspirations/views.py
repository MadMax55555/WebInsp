from rest_framework import viewsets, permissions
from .models import Tag, Showcase, Collection, CollectionItem
from .serializers import (
    TagSerializer,
    ShowcaseListSerializer,
    ShowcaseWriteSerializer,
    CollectionListSerializer,
    CollectionDetailSerializer,
    CollectionWriteSerializer,
    CollectionItemSerializer,
)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ["name", "slug"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class ShowcaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    search_fields = ["title", "description", "url"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]
    filterset_fields = ["tags"]

    def get_queryset(self):
        return Showcase.objects.prefetch_related("tags")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ShowcaseWriteSerializer
        return ShowcaseListSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    search_fields = ["name", "brief"]
    ordering_fields = ["created_at", "updated_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Collection.objects.prefetch_related("items__showcase__tags")

    def get_serializer_class(self):
        if self.action == "list":
            return CollectionListSerializer
        if self.action == "retrieve":
            return CollectionDetailSerializer
        return CollectionWriteSerializer


class CollectionItemViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionItemSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = [
        "showcase__title",
        "selection_reason",
        "review_note",
        "removal_reason",
    ]
    ordering_fields = ["created_at", "updated_at", "reviewed_at", "status"]
    ordering = ["-created_at"]
    filterset_fields = ["status", "collection"]

    def get_queryset(self):
        return (
            CollectionItem.objects
            .select_related("collection", "showcase")
            .prefetch_related("showcase__tags")
        )