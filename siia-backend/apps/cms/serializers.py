from rest_framework import serializers

from .models import Menu


class MenuTreeSerializer(serializers.ModelSerializer):
    submenus = serializers.SerializerMethodField()
    url = serializers.CharField(source="link_url")
    is_externo = serializers.BooleanField(source="abrir_em_nova_aba")
    icone_classe = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = Menu
        fields = ["id", "titulo", "url", "is_externo", "icone_classe", "submenus"]

    def get_submenus(self, obj):
        filhos = obj.filhos.filter(ativo=True).order_by("ordem", "id")
        return MenuTreeSerializer(filhos, many=True, context=self.context).data
