from django.contrib import admin
from .models import Tag, Showcase, Collection, CollectionItem


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Showcase)
class ShowcaseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "url", "created_at")
    search_fields = ("title", "description", "url")
    list_filter = ("tags", "created_at")
    filter_horizontal = ("tags",)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name", "brief")


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "showcase", "status", "reviewed_at", "created_at")
    search_fields = ("collection__name", "showcase__title")
    list_filter = ("status", "created_at")
    autocomplete_fields = ("collection", "showcase")