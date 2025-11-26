import { gql } from "@apollo/client";

export const GET_HOME_PAGE_DATA = gql`
  query GetHomePageData {
    latestArticles: obterArtigosCardList(pagina: 0, tamanho: 10) {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
    latestVolumes: obterVolumesList(pagina: 0, tamanho: 5) {
      id
      volumeTitulo
      volumeResumo
      imagemCapa {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const GET_MEUS_ARTIGOS = gql`
  query GetMeusArtigos {
    obterMeusArtigosCardList {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const SEARCH_ARTICLES = gql`
  query SearchArticles(
    $searchTerm: String!
    $searchByTitle: Boolean!
    $searchByAuthor: Boolean!
    $page: Int!
    $pageSize: Int!
  ) {
    titleResults: obterArtigoCardListPorTitulo(
      searchTerm: $searchTerm
      pagina: $page
      tamanho: $pageSize
    ) @include(if: $searchByTitle) {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
    authorResults: obterArtigoCardListPorNomeAutor(
      searchTerm: $searchTerm
      pagina: $page
      tamanho: $pageSize
    ) @include(if: $searchByAuthor) {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const GET_AUTOR_VIEW = gql`
  query GetAutorView($autorId: ID!) {
    obterAutorView(autorId: $autorId) {
      usuarioId
      nome
      url
    }
  }
`;

export const GET_ARTIGOS_BY_IDS = gql`
  query GetArtigosByIds($ids: [ID!]!) {
    obterArtigoCardListPorLista(ids: $ids) {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const GET_ARTIGOS_POR_TIPO = gql`
  query GetArtigosPorTipo($tipo: TipoArtigo!, $pagina: Int!, $tamanho: Int!) {
    obterArtigosCardListPorTipo(
      tipo: $tipo, 
      pagina: $pagina,  
      tamanho: $tamanho  
    ) {
      id
      titulo
      resumo
      status
      tipo
      permitirComentario
      midiaDestaque {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const GET_VOLUME_VIEW = gql`
  query GetVolumeView($volumeId: ID!) {
    obterVolumeView(volumeId: $volumeId) {
      id
      volumeTitulo
      volumeResumo
      imagemCapa {
        idMidia
        url
        textoAlternativo
      }
      artigos { 
        id
        titulo
        resumo
      }
    }
  }
`;

export const VERIFICAR_STAFF = gql`
  query VerificarStaff {
    verificarStaff
  }
`;

const COMMENT_FIELDS = gql`
  fragment CommentFields on Interaction {
    id
    artigoId
    usuarioId
    usuarioNome
    content
    dataCriacao
    parentCommentId
    replies {
      id
      artigoId
      usuarioId
      usuarioNome
      content
      dataCriacao
      parentCommentId
    }
  }
`;

export const GET_ARTIGO_VIEW = gql`
  query GetArtigoView($artigoId: String!) { 
    obterArtigoView(artigoId: $artigoId) {
      id
      titulo
      tipo
      permitirComentario
      conteudoAtual { 
        content
        midias {
          idMidia
          url
          textoAlternativo
        }
      }
      autores { 
        usuarioId
        nome
        url
      }
      volume { 
        id
        volumeTitulo
        volumeResumo
      }
      interacoes { 
        comentariosEditoriais { 
          ...CommentFields
        }
      }
    }
  }
  ${COMMENT_FIELDS} 
`;


export const GET_COMENTARIOS_PUBLICOS = gql`
  query GetComentariosPublicos(
    $artigoId: String!
    $page: Int!
    $pageSize: Int!
  ) {
    obterComentariosPublicos(
      artigoId: $artigoId
      pagina: $page
      tamanho: $pageSize
    ) {
      ...CommentFields
    }
  }
  ${COMMENT_FIELDS}
`;

export const CRIAR_COMENTARIO_PUBLICO = gql`
  mutation CriarComentarioPublico(
    $artigoId: ID!
    $content: String!
    $usuarioNome: String!
    $parentCommentId: ID!
  ) {
    criarComentarioPublico(
      artigoId: $artigoId
      content: $content
      usuarioNome: $usuarioNome
      parentCommentId: $parentCommentId
    ) {
      ...CommentFields
    }
  }
  ${COMMENT_FIELDS}
`;

export const ATUALIZAR_INTERACAO = gql`
  mutation AtualizarInteracao(
    $interacaoId: ID!
    $newContent: String!
    $commentary: String!
  ) {
    atualizarInteracao(
      interacaoId: $interacaoId
      newContent: $newContent
      commentary: $commentary
    ) {
      id
      content
    }
  }
`;

export const DELETAR_INTERACAO = gql`
  mutation DeletarInteracao($interacaoId: ID!, $commentary: String!) {
    deletarInteracao(interacaoId: $interacaoId, commentary: $commentary)
  }
`;

export const CRIAR_ARTIGO = gql`
  mutation CriarArtigo($input: CreateArtigoRequestInput!, $commentary: String!) {
    criarArtigo(input: $input, commentary: $commentary) {
      id
      titulo
      status
      editorial {
        id
      }
    }
  }
`;

export const OBTER_STAFF_LIST = gql`
  query ObterStaffList($page: Int!, $pageSize: Int!) {
    obterStaffList(pagina: $page, tamanho: $pageSize) {
      usuarioId  
      nome
      url
      job
      isActive
    }
  }
`;

export const CRIAR_NOVO_STAFF = gql`
  mutation CriarNovoStaff($input: CreateStaffRequestInput!, $commentary: String!) {
    criarNovoStaff(input: $input, commentary: $commentary) {
      id
      usuarioId
      nome
      job
      isActive
    }
  }
`;

export const ATUALIZAR_STAFF = gql`
  mutation AtualizarStaff(
    $input: UpdateStaffInput!
    $commentary: String!
  ) {
    atualizarStaff(
      input: $input
      commentary: $commentary
    ) {
      id
      usuarioId
      job
      isActive
    }
  }
`;

export const OBTER_PENDENTES = gql`
  query ObterPendentes(
    $pagina: Int!
    $tamanho: Int!
    $status: StatusPendente 
    $targetEntityId: String
    $targetType: TipoEntidadeAlvo 
    $requesterUsuarioId: String
  ) {
    obterPendentes(
      pagina: $pagina
      tamanho: $tamanho
      status: $status
      targetEntityId: $targetEntityId
      targetType: $targetType
      requesterUsuarioId: $requesterUsuarioId
    ) {
      id
      targetEntityId
      targetType
      status
      dateRequested
      requesterUsuarioId
      commentary
      commandType
      commandParametersJson
      idAprovador
      dataAprovacao
    }
  }
`;

export const RESOLVER_REQUISICAO_PENDENTE = gql`
  mutation ResolverRequisicaoPendente(
    $pendingId: String!
    $isApproved: Boolean!
  ) {
    resolverRequisicaoPendente(
      pendingId: $pendingId
      isApproved: $isApproved
    )
  }
`;

const EDITORIAL_CARD_FIELDS = gql`
  fragment EditorialCardFields on ArtigoCardListDTO {
    id
    titulo
    resumo
    status
    tipo
    permitirComentario
    midiaDestaque {
      idMidia
      url
      textoAlternativo
    }
  }
`;

export const OBTER_ARTIGOS_POR_STATUS = gql`
  query ObterArtigosPorStatus(
    $status: StatusArtigo!
    $pagina: Int!
    $tamanho: Int!
  ) {
    obterArtigosPorStatus(
      status: $status
      pagina: $pagina
      tamanho: $tamanho
    ) {
      ...EditorialCardFields
    }
  }
  ${EDITORIAL_CARD_FIELDS}
`;

export const OBTER_ARTIGOS_EDITORIAL_POR_TIPO = gql`
  query ObterArtigosEditorialPorTipo(
    $tipo: TipoArtigo!
    $pagina: Int!
    $tamanho: Int!
  ) {
    obterArtigosEditorialPorTipo(
      tipo: $tipo
      pagina: $pagina
      tamanho: $tamanho
    ) {
      ...EditorialCardFields
    }
  }
  ${EDITORIAL_CARD_FIELDS}
`;

export const SEARCH_ARTIGOS_EDITORIAL_BY_TITLE = gql`
  query SearchArtigosEditorialByTitle(
    $searchTerm: String!
    $pagina: Int!
    $tamanho: Int!
  ) {
    searchArtigosEditorialByTitle(
      searchTerm: $searchTerm
      pagina: $pagina
      tamanho: $tamanho
    ) {
      ...EditorialCardFields
    }
  }
  ${EDITORIAL_CARD_FIELDS}
`;

export const SEARCH_ARTIGOS_EDITORIAL_BY_AUTOR_IDS = gql`
  query SearchArtigosEditorialByAutorIds(
    $idsAutor: [String!]!
    $pagina: Int!
    $tamanho: Int!
  ) {
    searchArtigosEditorialByAutorIds(
      idsAutor: $idsAutor
      pagina: $pagina
      tamanho: $tamanho
    ) {
      ...EditorialCardFields
    }
  }
  ${EDITORIAL_CARD_FIELDS}
`;

export const ATUALIZAR_METADADOS_ARTIGO = gql`
  mutation AtualizarMetadadosArtigo(
    $id: String!
    $input: UpdateArtigoMetadataInput! 
    $commentary: String!
  ) {
    atualizarMetadadosArtigo(id: $id, input: $input, commentary: $commentary) {
      id
      status
      tipo
      permitirComentario
    }
  }
`;

const VOLUME_CARD_FIELDS = gql`
  fragment VolumeCardFields on VolumeCardDTO {
    id
    volumeTitulo
    volumeResumo
    imagemCapa {
      idMidia
      url
      textoAlternativo
    }
  }
`;

export const OBTER_VOLUMES = gql`
  query ObterVolumes($pagina: Int!, $tamanho: Int!) {
    obterVolumes(pagina: $pagina, tamanho: $tamanho) {
      ...VolumeCardFields
    }
  }
  ${VOLUME_CARD_FIELDS}
`;

export const OBTER_VOLUMES_POR_STATUS = gql`
  query ObterVolumesPorStatus(
    $status: StatusVolume!
    $pagina: Int!
    $tamanho: Int!
  ) {
    obterVolumesPorStatus(
      status: $status
      pagina: $pagina
      tamanho: $tamanho
    ) {
      ...VolumeCardFields
    }
  }  
  ${VOLUME_CARD_FIELDS}
`;

export const OBTER_VOLUMES_POR_ANO = gql`
  query ObterVolumesPorAno($ano: Int!, $pagina: Int!, $tamanho: Int!) {
    obterVolumesPorAno(ano: $ano, pagina: $pagina, tamanho: $tamanho) {
      id
      volumeTitulo
      volumeResumo
      imagemCapa {
        idMidia
        url
        textoAlternativo
      }
    }
  }
`;

export const OBTER_VOLUME_POR_ID = gql`
  query ObterVolumePorId($idVolume: String!) {
    obterVolumePorId(idVolume: $idVolume) {
      id
      edicao
      volumeTitulo
      volumeResumo
      m
      n
      year
      status
      imagemCapa {
        idMidia
        url
        textoAlternativo
      }
      artigos {
        id
        titulo
        resumo
      }
    }
  }
`;

export const CRIAR_VOLUME = gql`
  mutation CriarVolume($input: CreateVolumeRequestInput!, $commentary: String!) {
    criarVolume(input: $input, commentary: $commentary) {
      id
      volumeTitulo
      status
    }
  }
`;

export const ATUALIZAR_METADADOS_VOLUME = gql`
  mutation AtualizarMetadadosVolume(
    $volumeId: ID!
    $input: UpdateVolumeMetadataInput! 
    $commentary: String!
  ) {
    atualizarMetadadosVolume(
      volumeId: $volumeId
      input: $input
      commentary: $commentary
    )
  }
`;

const STAFF_COMMENT_FIELDS = gql`
  fragment StaffCommentFields on StaffComentario {
    id
    usuarioId
    data
    parent
    comment
  }
`;

const EDITORIAL_TEAM_FIELDS = gql`
  fragment EditorialTeamFields on EditorialTeam {
    initialAuthorId
    editorIds
    reviewerIds
    correctorIds
  }
`;

export const OBTER_ARTIGO_EDITORIAL_VIEW = gql`
  query ObterArtigoEditorialView($artigoId: String!) {
    obterArtigoEditorialView(artigoId: $artigoId) {
      id
      titulo
      resumo
      tipo
      status
      permitirComentario
      editorialId
      
      editorial {
        position
        currentHistoryId
        team {
          ...EditorialTeamFields
        }
      }
      
      conteudoAtual {
        version
        content
        midias {
          idMidia
          url
          textoAlternativo
        }
        staffComentarios {
          ...StaffCommentFields
        }
      }
      
      interacoes {
        comentariosEditoriais {
          ...CommentFields
        }
      }
    }
  }
  ${COMMENT_FIELDS}
  ${STAFF_COMMENT_FIELDS}
  ${EDITORIAL_TEAM_FIELDS}
`;

export const ATUALIZAR_CONTEUDO_ARTIGO = gql`
  # CORREÇÃO: O nome do tipo gerado pelo HotChocolate é MidiaEntryInputDTOInput!
  mutation AtualizarConteudoArtigo(
    $artigoId: artigoId!
    $newContent: String!
    $midias: [MidiaEntryInputDTOInput!]! 
    $commentary: String!
  ) {
    atualizarConteudoArtigo(
      artigoId: $artigoId
      newContent: $newContent
      midias: $midias
      commentary: $commentary
    )
  }
`;

export const ATUALIZAR_EQUIPE_EDITORIAL = gql`
  mutation AtualizarEquipeEditorial(
    $artigoId: ID!
    $teamInput: EditorialTeamInput! 
    $commentary: String!
  ) {
    atualizarEquipeEditorial(
      artigoId: $artigoId
      teamInput: $teamInput
      commentary: $commentary
    ) {
      team {
        ...EditorialTeamFields
      }
    }
  }
  ${EDITORIAL_TEAM_FIELDS}
`;

export const CRIAR_COMENTARIO_EDITORIAL = gql`
  mutation CriarComentarioEditorial(
    $artigoId: String!
    $content: String!
    $usuarioNome: String!
  ) {
    criarComentarioEditorial(
      artigoId: $artigoId
      content: $content
      usuarioNome: $usuarioNome
    ) {
      ...CommentFields
    }
  }
  ${COMMENT_FIELDS}
`;

export const ADD_STAFF_COMENTARIO = gql`
  mutation AddStaffComentario(
    $historyId: ID! 
    $comment: String!
    $parent: ID
  ) {
    addStaffComentario(
      historyId: $historyId
      comment: $comment
      parent: $parent
    ) {
      staffComentarios {
        ...StaffCommentFields
      }
    }
  }
  ${STAFF_COMMENT_FIELDS}
`;

export const UPDATE_STAFF_COMENTARIO = gql`
  mutation UpdateStaffComentario(
    $historyId: ID!       # De String! para ID!
    $comentarioId: ID!    # De String! para ID!
    $newContent: String!
  ) {
    updateStaffComentario(
      historyId: $historyId
      comentarioId: $comentarioId
      newContent: $newContent
    ) {
      staffComentarios {
        ...StaffCommentFields
      }
    }
  }
  ${STAFF_COMMENT_FIELDS}
`;

export const DELETE_STAFF_COMENTARIO = gql`
  mutation DeleteStaffComentario(
    $historyId: ID!       # De String! para ID!
    $comentarioId: ID!    # De String! para ID!
  ) {
    deleteStaffComentario(
      historyId: $historyId
      comentarioId: $comentarioId
    ) {
      staffComentarios {
        ...StaffCommentFields
      }
    }
  }
  ${STAFF_COMMENT_FIELDS}
`;