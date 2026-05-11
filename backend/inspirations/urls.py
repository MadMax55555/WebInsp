from rest_framework.routers import DefaultRouter
from .views import TagViewSet, ShowcaseViewSet, CollectionViewSet, CollectionItemViewSet

router = DefaultRouter()
router.register("tags", TagViewSet, basename="tag")
router.register("showcases", ShowcaseViewSet, basename="showcase")
router.register("collections", CollectionViewSet, basename="collection")
router.register("collection-items", CollectionItemViewSet, basename="collection-item")

urlpatterns = router.urls