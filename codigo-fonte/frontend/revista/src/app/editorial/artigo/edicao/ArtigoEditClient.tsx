'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { OBTER_ARTIGO_EDITORIAL_VIEW, OBTER_STAFF_LIST, ATUALIZAR_CONTEUDO_ARTIGO, ATUALIZAR_METADADOS_ARTIGO, ADD_STAFF_COMENTARIO } from '@/graphql/queries';
import useAuth from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ProgressBar from '@/components/ProgressBar';
import StaffCommentCard from '@/components/StaffCommentCard';
import { StaffMember } from '@/components/StaffCard';
import { PosicaoEditorial, VersaoArtigo, TipoArtigo, StatusArtigo } from '@/types/enums';
import { StaffComentario } from '@/types/index';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { User, Send } from 'lucide-react';
import StaffControlBar from '@/components/StaffControlBar';
import CreateCommentCard from '@/components/CreateCommentCard';
import dynamic from 'next/dynamic';
import type { Range } from 'quill';


const EditorialQuillEditor = dynamic(
    () => import('@/components/EditorialQuillEditor'),
    {
        ssr: false,
        loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-gray-400">Carregando editor...</div>
    }
);

const sanitizeId = (id: string) => {
    if (!id) return '';
    let cleaned = decodeURIComponent(id);
    if (cleaned.toLowerCase().startsWith('id=')) {
        cleaned = cleaned.substring(cleaned.indexOf('=') + 1);
    }
    return cleaned.trim().replace(/^['"]|['"]$/g, '');
};

interface EditorialTeamData {
    initialAuthorId: string[];
    editorIds: string[];
    reviewerIds: string[];
    correctorIds: string[];
    __typename: "EditorialTeam";
}

export interface ArtigoData {
    id: string;
    titulo: string;
    resumo: string;
    tipo: TipoArtigo;
    status: StatusArtigo;
    permitirComentario: boolean;
    editorialId: string;
    editorial: {
        position: PosicaoEditorial;
        team: EditorialTeamData;
        __typename: "EditorialView";
    };
}

interface EditorialViewData {
    obterArtigoEditorialView: ArtigoData & {
        autorIds: string[];
        editorial: { currentHistoryId: string; };
        conteudoAtual: {
            version: VersaoArtigo;
            content: string;
            midias: {
                idMidia: string;
                url: string;
                textoAlternativo: string;
            }[];
            staffComentarios: StaffComentario[];
            __typename: "ArtigoHistoryEditorialView";
        };
        interacoes: {
            comentariosEditoriais: any[];
            __typename: "InteractionConnectionDTO";
        };
        __typename: "ArtigoEditorialView";
    };
}

interface StaffQueryData { obterStaffList: StaffMember[]; }

const TeamHeader = ({ team, staffList }: { team: EditorialTeamData | undefined, staffList: StaffMember[] }) => {
    if (!team) return <div className="p-4 text-gray-500 text-sm italic">Equipe não definida</div>;

    const allTeamIds = [
        ...(team.initialAuthorId || []),
        ...(team.reviewerIds || []),
        ...(team.correctorIds || []),
        ...(team.editorIds || [])
    ].filter(Boolean);

    const uniqueIds = Array.from(new Set(allTeamIds));
    const teamMembers = uniqueIds.map(id => staffList.find(s => s?.usuarioId === id)).filter((s): s is StaffMember => !!s);

    return (
        <div className="flex flex-wrap gap-x-4 gap-y-4 mb-6 px-2 py-4 border-b border-gray-200">
            {teamMembers.map(member => (
                <div key={member.usuarioId} className="group relative flex flex-col items-center w-[40px]">
                    <div className="relative h-[30px] w-[30px] rounded-full overflow-hidden border border-gray-200 transition-all duration-300 opacity-70 group-hover:opacity-100 group-hover:scale-110 cursor-help">
                        <Image src={member.url || '/faviccon.png'} alt={member.nome} fill className="object-cover" />
                    </div>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap pointer-events-none">
                        <p className="font-bold">{member.nome}</p>
                        <p className="text-gray-300">{member.job}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

function ArtigoEditClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawArtigoId = searchParams.get('id') || searchParams.get('Id');
    const artigoId = rawArtigoId ? sanitizeId(rawArtigoId) : undefined;

    const { user, logout } = useAuth();
    const [isStaff, setIsStaff] = useState(false);
    const [userRole, setUserRole] = useState<'staff' | 'author' | 'team' | 'none'>('none');

    const [activeStaffComment, setActiveStaffComment] = useState<StaffComentario | null>(null);
    const [selectedQuillRange, setSelectedQuillRange] = useState<Range | null>(null);
    const [newStaffComment, setNewStaffComment] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editResumo, setEditResumo] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMidias, setEditMidias] = useState<any[]>([]);

    const { data: staffData, loading: loadingStaff } = useQuery<StaffQueryData>(OBTER_STAFF_LIST, {
        variables: { page: 0, pageSize: 200 },
        fetchPolicy: 'cache-and-network',
        onError: (err: ApolloError) => {
            if (err.graphQLErrors.some(e => e.extensions?.code === 'AUTH_FORBIDDEN')) {
                setIsStaff(false);
            }
        },
        onCompleted: (data) => {
            if (data.obterStaffList.find(s => s?.usuarioId === user?.id)?.isActive) setIsStaff(true);
        }
    });

    const staffList = staffData?.obterStaffList?.filter((s): s is StaffMember => !!s) ?? [];

    const { data, loading, refetch } = useQuery<EditorialViewData>(OBTER_ARTIGO_EDITORIAL_VIEW, {
        variables: { artigoId },
        skip: !artigoId || !user,
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
            const conteudo = data.obterArtigoEditorialView?.conteudoAtual;
            if (data.obterArtigoEditorialView && conteudo) {
                setEditTitle(data.obterArtigoEditorialView.titulo || '');
                setEditResumo(data.obterArtigoEditorialView.resumo || '');
                setEditContent(conteudo.content || '');
                setEditMidias(conteudo.midias ? conteudo.midias.map(m => ({ midiaID: m.idMidia, url: m.url, alt: m.textoAlternativo })) : []);
            }
        },
        onError: (err) => {
            toast.error("Erro ao carregar artigo: " + err.message);
            if (err.graphQLErrors.some(e => e.extensions?.code === 'AUTH_FORBIDDEN')) router.push('/');
        }
    });

    const artigo = data?.obterArtigoEditorialView;
    const editorial = artigo?.editorial;
    const conteudo = artigo?.conteudoAtual;

    const [addStaffComment, { loading: loadingAddComment }] = useMutation(ADD_STAFF_COMENTARIO, {
        onCompleted: () => { toast.success('Comentário salvo!'); setNewStaffComment(''); setSelectedQuillRange(null); refetch(); },
        onError: (err) => toast.error(err.message)
    });
    const [atualizarConteudo, { loading: loadingContent }] = useMutation(ATUALIZAR_CONTEUDO_ARTIGO);
    const [atualizarMetadados, { loading: loadingMeta }] = useMutation(ATUALIZAR_METADADOS_ARTIGO);

    useEffect(() => {
        if (loadingStaff || loading || !artigo || !user || !editorial) return;

        const team = editorial.team;
        if (!team) return;

        if (isStaff) { setUserRole('staff'); return; }

        const isAuthor = team.initialAuthorId?.includes(user.id);
        const isReviewer = team.reviewerIds?.includes(user.id);
        const isCorrector = team.correctorIds?.includes(user.id);
        const isEditor = team.editorIds?.includes(user.id);

        if (isAuthor) { setUserRole('author'); return; }
        if (isReviewer || isCorrector || isEditor) { setUserRole('team'); return; }

        toast.error("Você não tem permissão para editar este artigo.");
        router.push('/');
    }, [user, isStaff, artigo, loading, loadingStaff, router, editorial]);

    const mode = useMemo((): 'edit' | 'comment' => {
        if (!artigo || !editorial || !conteudo) return 'comment';

        if (editorial.position === PosicaoEditorial.ProntoParaPublicar && conteudo.version >= VersaoArtigo.TerceiraEdicao && isStaff) return 'edit';

        if (userRole === 'author') {
            if (editorial.position === PosicaoEditorial.ProntoParaPublicar || conteudo.staffComentarios.length > 0) return 'comment';
            return 'edit';
        }
        return 'comment';
    }, [userRole, artigo, editorial, conteudo, isStaff]);

    const handleTextSelect = (range: Range) => { if (range.length > 0) { setSelectedQuillRange(range); setActiveStaffComment(null); } else setSelectedQuillRange(null); };
    const handleHighlightClick = (comment: StaffComentario) => { setActiveStaffComment(comment); setSelectedQuillRange(null); };
    const handleContentChange = (html: string) => setEditContent(html);
    const handleMediaChange = (midia: { id: string; url: string; alt: string }) => setEditMidias(prev => [...prev, { midiaID: midia.id, url: midia.url, alt: midia.alt }]);

    const handleCreateStaffComment = () => {
        if (!newStaffComment.trim() || !selectedQuillRange || !editorial) return;
        const commentData = { selection: selectedQuillRange, comment: newStaffComment, date: new Date().toISOString(), commentId: `temp-${Date.now()}` };
        addStaffComment({ variables: { historyId: editorial.currentHistoryId, comment: JSON.stringify(commentData), parent: null } });
    };

    const handleSaveAuthorChanges = () => {
        if (!artigo) return;
        const toastId = toast.loading('Salvando alterações...');

        const midiasInput = editMidias.map(m => ({
            midiaId: m.midiaID,
            url: m.url,
            alt: m.alt
        }));

        Promise.all([
            atualizarConteudo({ variables: { artigoId: artigo.id, newContent: editContent, midias: midiasInput, commentary: "Update pelo autor" } }),
            atualizarMetadados({ variables: { id: artigo.id, input: { titulo: editTitle, resumo: editResumo }, commentary: "Update metadados" } })
        ]).then(() => {
            toast.success('Artigo salvo com sucesso!', { id: toastId });
            refetch();
        }).catch((err) => toast.error(err.message, { id: toastId }));
    };

    if (loading || loadingStaff) return <Layout pageType="editorial"><div className="flex h-[50vh] items-center justify-center"><p>Carregando ambiente editorial...</p></div></Layout>;

    if (!artigo || !editorial || !conteudo) return <Layout pageType="editorial"><div className="flex h-[50vh] items-center justify-center text-red-500"><p>Não foi possível carregar os dados do artigo.</p></div></Layout>;

    const comentariosEditoriaisSafe = artigo.interacoes?.comentariosEditoriais || [];
    const temComentarioUsuario = comentariosEditoriaisSafe.some(c => c.usuarioId === user?.id);

    return (
        <Layout pageType="editorial">
            <ProgressBar currentVersion={conteudo.version} />

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* Passa os dados atualizados e tipados corretamente para o StaffControlBar */}
                {userRole === 'staff' && (
                    <StaffControlBar
                        artigoId={artigo.id}
                        editorialId={artigo.editorialId}
                        currentData={artigo as ArtigoData}
                        staffList={staffList}
                        onUpdate={refetch}
                    />
                )}

                <TeamHeader team={editorial.team} staffList={staffList} />

                <div className="flex flex-col lg:flex-row gap-6 mt-6">
                    <div className={`flex-1 transition-all duration-300 ${((mode === 'comment' || conteudo.version > 0) ? 'lg:w-3/4' : 'w-full')}`}>

                        {mode === 'edit' ? (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-std w-full font-serif text-xl" />
                                </div>
                                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Resumo</label>
                                    <textarea value={editResumo} onChange={(e) => setEditResumo(e.target.value)} className="input-std w-full h-24 resize-none" />
                                </div>
                                <div className="bg-white p-1 rounded shadow-sm border border-gray-200">
                                    <EditorialQuillEditor mode="edit" initialContent={editContent} onContentChange={handleContentChange} onMediaChange={handleMediaChange} />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800">Revisão e Comentários</h3>
                                <EditorialQuillEditor mode="comment" initialContent={conteudo.content} staffComments={conteudo.staffComentarios} onTextSelect={handleTextSelect} onHighlightClick={handleHighlightClick} />
                            </div>
                        )}

                        {userRole !== 'staff' && mode === 'edit' && (
                            <div className="flex justify-end gap-4 mt-6 sticky bottom-4 z-20 p-4 bg-white/90 backdrop-blur shadow-lg rounded-lg border border-gray-200">
                                <button onClick={() => refetch()} className="btn-secondary">Descartar Alterações</button>
                                <button onClick={handleSaveAuthorChanges} disabled={loadingContent || loadingMeta} className="btn-primary">Salvar Tudo</button>
                            </div>
                        )}

                        {editorial.position === PosicaoEditorial.ProntoParaPublicar && (
                            <div className="mt-10 pt-6 border-t">
                                <h3 className="text-xl font-semibold mb-4">Parecer Final</h3>
                                {temComentarioUsuario ? (
                                    <div className="p-4 bg-green-50 text-green-800 rounded border border-green-200">Seu parecer já foi registrado.</div>
                                ) : (
                                    <CreateCommentCard artigoId={artigo.id} onCommentPosted={refetch} isEditorial={true} />
                                )}
                            </div>
                        )}
                    </div>

                    {(mode === 'comment' || conteudo.version > 0) && (
                        <div className="lg:w-1/4 flex-shrink-0">
                            <div className="sticky top-24">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Anotações ({conteudo.staffComentarios.length})</h4>

                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {selectedQuillRange && (
                                        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-xs text-yellow-800 mb-2 font-semibold">Novo comentário na seleção:</p>
                                            <textarea autoFocus value={newStaffComment} onChange={(e) => setNewStaffComment(e.target.value)} className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Digite sua observação..." rows={3} />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setSelectedQuillRange(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                                <button onClick={handleCreateStaffComment} disabled={loadingAddComment} className="btn-primary py-1 px-3 text-xs">
                                                    {loadingAddComment ? '...' : <Send size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeStaffComment && (
                                        <StaffCommentCard
                                            comment={activeStaffComment}
                                            historyId={editorial.currentHistoryId}
                                            onClose={() => setActiveStaffComment(null)}
                                            onCommentChange={refetch}
                                            staffList={staffList}
                                        />
                                    )}

                                    {!activeStaffComment && !selectedQuillRange && conteudo.staffComentarios.filter(c => !c.parent).map(comment => {
                                        let text = comment.comment;
                                        try { text = JSON.parse(comment.comment).comment; } catch { }

                                        return (
                                            <div key={comment.id} onClick={() => handleHighlightClick(comment)} className="group p-3 bg-white border border-gray-200 rounded hover:border-emerald-400 cursor-pointer transition-all hover:shadow-md">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {staffList.find(s => s.usuarioId === comment.usuarioId)?.nome || 'Usuário'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 ml-auto">
                                                        {new Date(comment.data).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2 group-hover:text-gray-900">{text}</p>
                                            </div>
                                        );
                                    })}

                                    {!activeStaffComment && !selectedQuillRange && conteudo.staffComentarios.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center italic py-4">Nenhuma anotação nesta versão.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default function ArtigoEditPageWrapper() {
    return <Suspense fallback={<Layout pageType="editorial"><div className="text-center mt-20">Carregando...</div></Layout>}><ArtigoEditClient /></Suspense>;
}