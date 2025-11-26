'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation } from '@apollo/client/react';
import { CRIAR_ARTIGO, GET_MEUS_ARTIGOS } from '@/graphql/queries';
import useAuth from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ImageAltModal from '@/components/ImageAltModal';
import { Check, X, Trash2, Plus, UploadCloud } from 'lucide-react';
import 'quill/dist/quill.snow.css';
import { TipoArtigo } from '@/types/enums';
import type Quill from 'quill';
import toast from 'react-hot-toast';
import { USER_API_BASE } from '@/lib/fetcher';

interface UsuarioBusca { id: string; name: string; sobrenome?: string; foto?: string; }
interface MidiaEntry { midiaID: string; url: string; alt: string; }
interface CriarArtigoData { criarArtigo: { id: string; titulo: string; status: string; editorial: { id: string; }; }; }

export default function SubmitArtigoClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [titulo, setTitulo] = useState('');
    const [resumo, setResumo] = useState('');
    const [quillContent, setQuillContent] = useState('');
    const [selectedAuthors, setSelectedAuthors] = useState<UsuarioBusca[]>([]);
    const [authorSearchQuery, setAuthorSearchQuery] = useState('');
    const [authorSearchResults, setAuthorSearchResults] = useState<UsuarioBusca[]>([]);
    const [externalRefs, setExternalRefs] = useState<string[]>([]);
    const [newRef, setNewRef] = useState('');
    const [midias, setMidias] = useState<MidiaEntry[]>([]);
    const [capaPreview, setCapaPreview] = useState<string | null>(null);
    const [isAltModalOpen, setIsAltModalOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ id: string; url: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const quillRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);
    const initializedRef = useRef(false);

    const [criarArtigo] = useMutation<CriarArtigoData>(CRIAR_ARTIGO, {
        onCompleted: (data) => { if (data?.criarArtigo?.id) { toast.success('Artigo enviado!'); router.push('/professores'); } else toast.error('Falha inesperada.'); },
        onError: (err) => { setErrorMsg(err.message); toast.error(err.message); },
        refetchQueries: [{ query: GET_MEUS_ARTIGOS }]
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (authorSearchQuery.length < 3) { setAuthorSearchResults([]); return; }
            const token = localStorage.getItem('userToken');
            if (!token) return;
            try {
                const res = await fetch(`${USER_API_BASE}/UserSearch?nome=${authorSearchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    const filtered = data.filter((u: any) => u.id !== user?.id && !selectedAuthors.some(sel => sel.id === u.id));
                    setAuthorSearchResults(filtered);
                }
            } catch (err) { console.error(err); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [authorSearchQuery, selectedAuthors, user?.id]);

    const addAuthor = (author: UsuarioBusca) => { setSelectedAuthors([...selectedAuthors, author]); setAuthorSearchQuery(''); setAuthorSearchResults([]); };
    const removeAuthor = (id: string) => { setSelectedAuthors(selectedAuthors.filter(a => a.id !== id)); };
    const addExternalRef = () => { if (newRef.trim()) { setExternalRefs([...externalRefs, newRef.trim()]); setNewRef(''); } };
    const removeExternalRef = (index: number) => { setExternalRefs(externalRefs.filter((_, i) => i !== index)); };

    const imageHandler = () => {
        const input = document.createElement('input'); input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
        input.onchange = () => {
            const file = input.files ? input.files[0] : null;
            if (file) {
                const reader = new FileReader();
                reader.onloadstart = () => toast.loading('Processando...', { id: 'img' });
                reader.onloadend = () => {
                    setPendingImage({ id: `img-${Date.now()}`, url: reader.result as string });
                    toast.dismiss('img'); setIsAltModalOpen(true);
                };
                reader.readAsDataURL(file);
            }
        };
    };

    const handleAltTextConfirm = (altText: string) => {
        if (!pendingImage || !quillInstance.current) return;
        const newMedia: MidiaEntry = { midiaID: pendingImage.id, url: pendingImage.url, alt: altText };
        setMidias(prev => [...prev, newMedia]);
        if (midias.length === 0) setCapaPreview(pendingImage.url);
        const range = quillInstance.current.getSelection(true);
        quillInstance.current.insertEmbed(range.index, 'image', pendingImage.url);
        quillInstance.current.setSelection(range.index + 1);
        setIsAltModalOpen(false); setPendingImage(null); toast.success('Imagem adicionada!');
    };

    useEffect(() => {
        if (initializedRef.current) return;
        const initializeQuill = async () => {
            const { default: QuillModule } = await import('quill');
            if (quillRef.current && !quillInstance.current) {
                const quill = new QuillModule(quillRef.current, { theme: 'snow', placeholder: 'Conteúdo...', modules: { toolbar: { container: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['blockquote', 'code-block'], [{ 'color': [] }, { 'background': [] }], ['link', 'image'], ['clean']], handlers: { image: imageHandler } } } });
                quillInstance.current = quill; initializedRef.current = true;
                quill.on('text-change', () => setQuillContent(quill.root.innerHTML));
            }
        };
        initializeQuill();
    }, []);

    const handleSubmit = async () => {
        if (!titulo.trim() || !resumo.trim() || !quillContent.trim()) return toast.error("Preencha todos os campos.");
        if (!user || !user.id) return toast.error("Usuário não autenticado."); // Safety check

        setIsSubmitting(true); setErrorMsg(''); toast.loading('Enviando...', { id: 'sub' });

        // 1. Criar AutorInputDTOs para co-autores selecionados
        const coAutoresInput = selectedAuthors.map(a => ({ usuarioId: a.id, nome: `${a.name} ${a.sobrenome || ''}`.trim(), url: a.foto || '' }));

        // 2. Criar AutorInputDTO para o usuário logado (Autor Principal)
        const principalAuthorInput = {
            usuarioId: user.id,
            nome: user.name || localStorage.userName || 'Autor Principal',
            url: user.foto || localStorage.userFoto || ''
        };

        // 3. Combinar as listas, garantindo que o autor principal venha primeiro
        const autoresInput = [principalAuthorInput, ...coAutoresInput];

        const midiasInput = midias.map(m => ({ midiaID: m.midiaID, url: m.url, alt: m.alt }));

        await criarArtigo({ variables: { input: { titulo, resumo, conteudo: quillContent, tipo: TipoArtigo.Artigo, autores: autoresInput, referenciasAutor: externalRefs, midias: midiasInput }, commentary: "Submissão inicial" } });

        toast.dismiss('sub'); setIsSubmitting(false);
    };

    const handleDelete = () => { if (confirm("Apagar rascunho?")) { toast.success('Apagado.'); router.push('/professores'); } };
    if (!user) return null;

    return (
        <Layout>
            <ImageAltModal isOpen={isAltModalOpen} onConfirm={handleAltTextConfirm} />
            <div className="max-w-4xl mx-auto mt-10 mb-20">
                <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Submeter Novo Artigo</h1>
                {errorMsg && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">{errorMsg}</div>}
                <div className="space-y-8">
                    <div><label className="block text-lg font-semibold text-gray-700 mb-2">Título</label><input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input-std" placeholder="Título principal" /></div>
                    <div><label className="block text-lg font-semibold text-gray-700 mb-2">Resumo</label><textarea value={resumo} onChange={(e) => setResumo(e.target.value)} className="input-std h-32 resize-none" placeholder="Resumo curto..." /></div>
                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Autores (RBEB)</label>
                        <div className="relative">
                            <input type="text" value={authorSearchQuery} onChange={(e) => setAuthorSearchQuery(e.target.value)} className="input-std" placeholder="Buscar autor..." />
                            {authorSearchResults.length > 0 && (
                                <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-md mt-1 z-10 max-h-60 overflow-y-auto">
                                    {authorSearchResults.map(u => (
                                        <li key={u.id} onClick={() => addAuthor(u)} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition">
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                {/* FIX: Image fallback */}
                                                <Image src={u.foto || '/faviccon.png'} alt={u.name} fill className="object-cover" />
                                            </div>
                                            <span className="font-medium text-gray-800">{u.name} {u.sobrenome}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-full">
                                <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200">
                                    {/* FIX: Image fallback */}
                                    <Image src={localStorage.userFoto || '/faviccon.png'} alt="Eu" fill className="object-cover" />
                                </div>
                                <span className="text-sm font-medium text-emerald-800">Você (Autor Principal)</span>
                            </div>
                            {selectedAuthors.map(author => (
                                <div key={author.id} className="group relative flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-full cursor-pointer hover:border-red-300" onClick={() => removeAuthor(author.id)}>
                                    <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {/* FIX: Image fallback */}
                                        <Image src={author.foto || '/faviccon.png'} alt={author.name} fill className="object-cover" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{author.name} {author.sobrenome}</span>
                                    <Check size={16} className="text-emerald-600" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-black/80 text-white text-xs px-2 py-1 rounded">Remover</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Referências Notáveis</label>
                        <div className="flex gap-2"><input type="text" value={newRef} onChange={(e) => setNewRef(e.target.value)} className="input-std" placeholder="Autores externos..." /><button type="button" onClick={addExternalRef} className="btn-secondary"><Plus /></button></div>
                        <ul className="mt-3 space-y-2">{externalRefs.map((ref, idx) => <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border"><span className="text-sm text-gray-700">{ref}</span><button onClick={() => removeExternalRef(idx)} className="text-red-500"><X size={16} /></button></li>)}</ul>
                    </div>
                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Conteúdo</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-gray-300"><div ref={quillRef} style={{ minHeight: '400px', backgroundColor: 'white' }} /></div>
                    </div>
                    {capaPreview && <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-4"><div className="w-20 h-20 relative rounded-full overflow-hidden bg-gray-200"><Image src={capaPreview} alt="Capa" fill className="object-cover" /></div><p className="text-sm text-gray-700">Capa definida pela primeira imagem.</p></div>}
                    <div className="flex justify-between pt-8 border-t mt-8"><button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn-danger"><Trash2 size={20} /> Deletar</button><button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-primary"><UploadCloud size={20} /> Enviar</button></div>
                </div>
            </div>
        </Layout>
    );
}