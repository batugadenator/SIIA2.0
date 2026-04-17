import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { criarNoticia, editarNoticia, fetchNoticiaWorkflow, NoticiaWorkflow, uploadCmsImage } from "../../../services/cms";
import "../cms-admin.css";

export default function NoticiaFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdicao = Boolean(id);

  const [titulo, setTitulo] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [categoriaTexto, setCategoriaTexto] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [isDestaque, setIsDestaque] = useState(true);
  const [carregando, setCarregando] = useState(isEdicao);
  const [salvando, setSalvando] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchNoticiaWorkflow(Number(id))
      .then((n: NoticiaWorkflow) => {
        setTitulo(n.titulo);
        setImagemUrl(n.imagem_url);
        setCategoriaTexto(n.categoria_texto);
        setConteudo(n.conteudo);
        setIsDestaque(n.is_destaque);
      })
      .catch(() => setErro("Não foi possível carregar a notícia."))
      .finally(() => setCarregando(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErro("O título é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const payload = {
        titulo,
        imagem_url: imagemUrl,
        categoria_texto: categoriaTexto || "Geral",
        conteudo,
        is_destaque: isDestaque,
      };
      if (isEdicao) {
        await editarNoticia(Number(id), payload);
      } else {
        await criarNoticia(payload);
      }
      navigate("/dashboard/cms/noticias");
    } catch {
      setErro("Erro ao salvar notícia. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadImagem = async (file?: File | null) => {
    if (!file) return;
    setUploadingImagem(true);
    try {
      const data = await uploadCmsImage(file);
      setImagemUrl(data.url);
    } catch {
      setErro("Erro no upload da imagem.");
    } finally {
      setUploadingImagem(false);
    }
  };

  if (carregando) return <div className="br-loading" aria-label="Carregando notícia..." />;

  return (
    <div className="cms-form-max">
      <h2>
        <i className={`fas ${isEdicao ? "fa-edit" : "fa-plus"} mr-2`} aria-hidden="true" />
        {isEdicao ? "Editar Notícia" : "Nova Notícia"}
      </h2>

      {erro && (
        <div className="br-message danger" role="alert">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="br-input mb-3">
          <label htmlFor="titulo">
            Título <span aria-hidden="true">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            maxLength={200}
            aria-required="true"
          />
        </div>

        <div className="br-input mb-3">
          <label htmlFor="categoria">Categoria</label>
          <input
            id="categoria"
            type="text"
            value={categoriaTexto}
            onChange={(e) => setCategoriaTexto(e.target.value)}
            maxLength={50}
            placeholder="Ex: Saúde, Educação, Gestão..."
          />
        </div>

        <div className="br-input mb-3">
          <label htmlFor="imagem-url">URL da Imagem</label>
          <input
            id="imagem-url"
            type="url"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            placeholder="https://..."
          />
          <small className="text-muted">Você pode colar URL ou enviar arquivo local abaixo.</small>
        </div>

        <div className="br-input mb-3">
          <label htmlFor="imagem-upload">Upload da Imagem</label>
          <input
            id="imagem-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            onChange={(e) => handleUploadImagem(e.target.files?.[0])}
          />
          {uploadingImagem && <small>Enviando imagem...</small>}
        </div>

        <div className="br-textarea mb-3">
          <label htmlFor="conteudo">Conteúdo</label>
          <textarea
            id="conteudo"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={8}
          />
        </div>

        <div className="br-checkbox mb-4">
          <input
            id="is-destaque"
            type="checkbox"
            checked={isDestaque}
            onChange={(e) => setIsDestaque(e.target.checked)}
          />
          <label htmlFor="is-destaque">Exibir no mosaico de destaques</label>
        </div>

        <div className="cms-row-gap">
          <button type="submit" className="br-button primary" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            className="br-button secondary"
            onClick={() => navigate("/dashboard/cms/noticias")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
