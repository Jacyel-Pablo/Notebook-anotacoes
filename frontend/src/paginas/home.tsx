import { useEffect, useState, useRef } from "react"
import icone_iamai from "../assets/Iamai.png"

export default function Home(props: any) {
    const backend = props.backend
    // Pegando csrf_token do navegador

    interface Anotacoes_list {
        id: string,
        anotacao: string,
        data: string
    }

    interface Dados {
        anotacao: string,
        anotacoes_list: Anotacoes_list[]

        id_anotacao_apagar: string,
        csrftoken: CookieListItem | null
    }

    const [dados, setDados] = useState<Dados>({
        anotacao: "",
        anotacoes_list: [],

        id_anotacao_apagar: "",
        csrftoken: null
    })

    interface AbreFecharJanela {
        mensagem_1: string,
        mensagem_2: string,
        apagar_o_que: string
    }

    const [abreFecharJanela, setAbreFecharJanela] = useState<AbreFecharJanela>({
        mensagem_1: "",
        mensagem_2: "",
        apagar_o_que: "",
    })

    const [aberta, setAberta] = useState(false);

    function pega_dados(e: any): void {
        setDados({
            ...dados,
            [e.target.id]: e.target.value
        })
    }

    function sair_usuario(): void {
        cookieStore.delete("csrftoken")
        cookieStore.delete("jwt")
        location.href = "/"
    }

    // Função que vai verificar se o usuário está dentro do limite de request
    function verificar_rate_limit(csrf_token: string | undefined, jwt: string | undefined, status_code: number, ): void {
        // Verificando se o usuário está dentro do rate limit
        if (!csrf_token && status_code == 403) {
            alert("Um dos seus dados de acesso está incorreto e necessario refazer o login")
            sair_usuario()

        } else if (!jwt && status_code == 500) {
            alert("Token de sessão não encontrado")
            sair_usuario()

        } else if (status_code == 403) {
            alert("Limite de requisição atingida tenter novamente mas tarde")
        }
    }

    async function enviar_anotacao(quem_esta_enviando: string, anotacao_ia: string) {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        if (quem_esta_enviando === "humano") {
            if (dados.anotacao.length >= 10) {

                await fetch(`${backend}/anotacao/enviar_anotacao/`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrf_token?.value ?? "",
                        "Authorization": `Bearer ${token_jwt?.value}`
                    },
                    body: JSON.stringify({
                        id_topico: idTopicoAtual,
                        anotacao: dados.anotacao,
                    })

                }).then(async res => {

                    // Verificando se o usuário está dentro do rate limit
                    verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                    const res_json = await res.json()

                    if (res.status === 201) {
                        const copy_dados: Anotacoes_list[] = dados.anotacoes_list
                        copy_dados.push(res_json["dados"])

                        setDados({
                            ...dados,
                            anotacao: "",
                            anotacoes_list: copy_dados
                        })

                    } else {
                        alert(res_json["erro"])

                        if (res_json["erro"] === "Ocorreu um erro o token de login e inválido" || res_json["erro"] === "usuário inválido") {
                            sair_usuario()
                        }
                    }
                })

            } else {
                alert("Sua anotação precisa ter no minimo 10 caracteres")
                setDados({
                    ...dados,
                    anotacao: "",
                })
            }

        } else {
            if (anotacao_ia.length >= 10) {
                await fetch(`${backend}/anotacao/enviar_anotacao/`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrf_token?.value ?? "",
                        "Authorization": `Bearer ${token_jwt?.value}`
                    },
                    body: JSON.stringify({
                        id_topico: idTopicoAtual,
                        anotacao: anotacao_ia
                    })

                }).then(async res => {

                    // Verificando se o usuário está dentro do rate limit
                    verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                    const res_json = await res.json()

                    if (res.status === 201) {
                        const copy_dados: Anotacoes_list[] = dados.anotacoes_list
                        copy_dados.push(res_json["dados"])

                        setDados({
                            ...dados,
                            anotacao: "",
                            anotacoes_list: copy_dados
                        })

                    } else {
                        alert(res_json["erro"])

                        if (res_json["erro"] === "Ocorreu um erro o token de login e inválido" || res_json["erro"] === "usuário inválido") {
                            sair_usuario()
                        }
                    }
                })

            } else {
                alert("Sua anotação precisa ter no minimo 10 caracteres")
                setDados({
                    ...dados,
                    anotacao: "",
                })
            }
        }
    }

    // Elemento da janela que pergunta se realmente vc que apagar a mensagem
    const elemento_abre_fechar: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null)

    // Essa função abre e fechar a janela que pergunta se realmente vc que apagar a mensagem, usuário ou o chat da ia
    function abre_fechar(e: any, apagar_o_que: string): void {
        if (e.target.id === "fechado") {
            if (apagar_o_que === "mensagem") {
                setAbreFecharJanela({
                    ...abreFecharJanela,
                    mensagem_1: "Você realmente que apagar essa mensagem ? ",
                    mensagem_2: " essa ação não podera se desfeita",
                    apagar_o_que: apagar_o_que
                })

            } else if (apagar_o_que === "apagar_usuário") {
                setAbreFecharJanela({
                    ...abreFecharJanela,
                    mensagem_1: "Você realmente que apagar o usuário atual ? ",
                    mensagem_2: " essa ação não podera se desfeita",
                    apagar_o_que: apagar_o_que
                })

            } else {
                setAbreFecharJanela({
                    ...abreFecharJanela,
                    mensagem_1: "Você realmente gostaria de apagar o histórico do chat ? ",
                    mensagem_2: " essa ação não podera se desfeita",
                    apagar_o_que: apagar_o_que
                })
            }

            // Pegar elemento para remover-lo na função deletar_anotacao
            anotacao_element.current = e.target.parentElement?.parentElement

            // abre a tela de confirmação para apagar mensagem
            elemento_abre_fechar.current!.className = "h-[100dvh] w-[100dvw] fixed z-20"

        } else {
            // pegar div corpo
            elemento_abre_fechar.current!.className = "h-[0dvh] w-[0dvw] fixed"
        }
    }

    // Aqui vai ficar o elemento da anotacao que vai se "apagada"
    const anotacao_element: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null)

    // Apagar as anotações ou usuário atual ou então as mensagens do chat de ia
    async function deletar_anotacao(deletar_user_ia: boolean) {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        if (deletar_user_ia) {
            await fetch(`${backend}/cadastro/apagar_usuario/`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                credentials: "include",

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                const res_json = await res.json()

                if (res.status === 201) {
                    alert("Usuário apagado com sucesso")
                    await cookieStore.delete("jwt")
                    await cookieStore.delete("csrftoken")
                    location.href = "/"

                } else {
                    alert(res_json["erro"])
                }
            })

        } else {
            // Se for para apagar a mensagem entrar aqui
            if (abreFecharJanela.apagar_o_que === "mensagem") {
                await fetch(`${backend}/anotacao/apagar_anotacao/`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "X-CSRFToken": csrf_token?.value ?? "",
                        "Authorization": `Bearer ${token_jwt?.value}`
                    },
                    body: JSON.stringify({
                        id_anotacao: dados.id_anotacao_apagar,
                    })

                }).then(async res => {

                    // Verificando se o usuário está dentro do rate limit
                    verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                    const res_json = await res.json()

                    if (res.status === 200) {
                        alert("Mensagem apagadar com sucesso!")

                        // Div 1
                        anotacao_element.current!.children[0].className = ""
                        anotacao_element.current!.children[0]!.children[0].className = "text-[0%]"
                        anotacao_element.current!.children[0]!.children[1].className = "text-[0%]"
                        
                        // Div 2
                        anotacao_element.current!.className = "h-[0%] overflow-hidden mt-0 ml-0 text-[0%]"
                        anotacao_element.current!.children[1]!.children[0].className = "h-[0%] overflow-hidden mt-0 ml-0 text-[0%]"
                        anotacao_element.current!.children[1]!.children[0].className = "text-[0%]"
                        anotacao_element.current = null

                        setDados({
                            ...dados,
                            id_anotacao_apagar: ""
                        })

                    } else {
                        alert(res_json["erro"])

                        if (res_json["erro"] === "usuário inválido") {
                            sair_usuario()
                        }

                        setDados({
                            ...dados,
                            id_anotacao_apagar: ""
                        })
                    }
                })

                // Se for para apagar o usuário entrar aqui
            } else if (abreFecharJanela.apagar_o_que === "apagar_usuário") {

                await fetch(`${backend}/cadastro/apagar_usuario/`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": csrf_token?.value ?? "",
                        "Authorization": `Bearer ${token_jwt?.value}`
                    },
                    credentials: "include",

                }).then(async res => {

                    // Verificando se o usuário está dentro do rate limit
                    verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                    const res_json = await res.json()

                    if (res.status === 201) {
                        alert("Usuário apagado com sucesso")
                        await cookieStore.delete("jwt")
                        await cookieStore.delete("csrftoken")
                        location.href = "/"

                    } else {
                        alert(res_json["erro"])
                    }
                })

                // Se for para apagar o historico do chat de ia entrar aqui
            } else {
                await fetch(`${backend}/chatbot_ia/limpar_historico_chat/`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": csrf_token?.value ?? "",
                        "Authorization": `Bearer ${token_jwt?.value}`
                    },
                    credentials: "include"

                }).then(async res => {

                    // Verificando se o usuário está dentro do rate limit
                    verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                    const res_json = await res.json()

                    if (res.status === 200) {
                        alert("Mensagens do chat apagador com sucesso")

                        setListaMensagensIa([])

                    } else {
                        alert(res_json["erro"])
                    }
                })
            }
        }
    }

    interface ListaMensagensIa {
        mensagem_usuario: string,
        mensagem_ia: string
    }

    const [listaMensagensIa, setListaMensagensIa] = useState<ListaMensagensIa[]>([])

    interface UserMensagem {
        mensagem: string,
        carregando: boolean
    }

    const [userMensagem, setUserMensagem] = useState<UserMensagem>({
        mensagem: "",
        carregando: false
    })

    // Pegar o retorno da mensagem que a IA escreveu
    async function pegar_mensagem_ia() {
        const token_jwt = await cookieStore.get("jwt")
        const csrf_token = await cookieStore.get("csrftoken")

        setUserMensagem({
            ...userMensagem,
            carregando: true
        })

        await fetch(`${backend}/chatbot_ia/ia/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrf_token?.value ?? "",
                "Authorization": `Bearer ${token_jwt?.value}`
            },
            credentials: "include",
            body: JSON.stringify({ "lista_msg": listaMensagensIa, "msg": userMensagem.mensagem })

        }).then(async res => {

            // Verificando se o usuário está dentro do rate limit
            verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

            const res_json = await res.json()

            if (res.status === 200) {
                switch (res_json["funcao_atual"]) {
                    case "sair":
                        sair_usuario()
                        break

                    case "criar_anotacao":
                        enviar_anotacao("ia", res_json["conteudo"])
                        break

                    case "criar_topico":
                        criarEnviarTopico(res_json["conteudo"])
                        break

                    case "apagar_conta":
                        deletar_anotacao(true)
                        break
                }

                const adicionar_a_lista_mensagem: ListaMensagensIa = {
                    mensagem_usuario: userMensagem.mensagem,
                    mensagem_ia: res_json["valor"]
                }

                setListaMensagensIa(prev => [
                    ...prev,
                    adicionar_a_lista_mensagem
                ])

            } else {
                alert(res_json["erro"])
            }

            setUserMensagem({
                ...userMensagem,
                mensagem: "",
                carregando: false
            })
        })
    }

    interface Topico {
        id: string
        nome_topico: string
    }

    const [ listaTopicos, setListaTopicos ] = useState<Topico[]>([])

    // Colocar o id do tópico atual
    const [ idTopicoAtual, setIdTopicoAtual ] = useState("")

    interface AbrirMenuTopicos {
        abrir: boolean
    }

    // Abrir o menu que lista os tópicos da versão mobile
    const [ abrirMenuTopicos, setAbrirMenuTopicos ] = useState<AbrirMenuTopicos>({
        abrir: false
    })

    interface CriarTopico{
        abrir: boolean,
        topico: string
    }

    // Abre parte de adicionar um tópico novo a lista de tópicos
    const [ criarTopico, setCriarTopico ] = useState<CriarTopico>({
        abrir: false,
        topico: ""
    })

    const [ nomeTopicoAtual, setNomeTopicoAtual ] = useState("Todos")

    // Enviar titulo do tópico que foi criado
    async function criarEnviarTopico(nome_topico_ia: string) {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        if (nome_topico_ia.length === 0) {
            await fetch(`${backend}/topicos/criar_topico/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                credentials: "include",
                body: JSON.stringify({
                    "topico": criarTopico.topico
                })

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                const res_json = await res.json()

                if (res.status === 201) {
                    // alert("Tópico criado com sucesso")

                    const lista_topicos = [...listaTopicos]
                    lista_topicos.push({"id": res_json["valor"].toString(), "nome_topico": criarTopico["topico"]})

                    setListaTopicos(lista_topicos)

                    setCriarTopico({
                        ...criarTopico,
                        abrir: false,
                        topico: ""
                    })

                } else {
                    alert(res_json["erro"])
                }
            })

        } else {
            await fetch(`${backend}/topicos/criar_topico/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                credentials: "include",
                body: JSON.stringify({
                    "topico": nome_topico_ia
                })

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                const res_json = await res.json()

                if (res.status === 201) {
                    // alert("Tópico criado com sucesso")

                    const lista_topicos = [...listaTopicos]
                    lista_topicos.push({"id": res_json["valor"].toString(), "nome_topico": nome_topico_ia})

                    setListaTopicos(lista_topicos)

                    setCriarTopico({
                        ...criarTopico,
                        abrir: false,
                        topico: ""
                    })

                } else {
                    alert(res_json["erro"])
                }
            })
        }
    }

    function abreeFecharInputRenomeiaTopico(e: any) {
        let inputRenomeiaTopico
        let inputCancelarTopico
        let paragrafoTopico

        if (e.target.id != "cancelar") {
            inputRenomeiaTopico = e.target!.parentElement!.parentElement!.parentElement!.children[0].children[0]
            inputCancelarTopico = e.target!.parentElement!.parentElement!.parentElement!.children[0].children[1]
            paragrafoTopico = e.target!.parentElement!.parentElement!.parentElement!.children[0].children[2]

        } else {
            inputRenomeiaTopico = e.target!.parentElement.children[0]
            inputCancelarTopico = e.target!.parentElement.children[1]
            paragrafoTopico = e.target!.parentElement.children[2]
        }

        setMenuAbertoSelectTopico(null)

        if (inputRenomeiaTopico.id === "fechado") {
            paragrafoTopico.className = "text-[0%] px-0 whitespace-nowrap"
            inputCancelarTopico.className = "h-12 w-[30%] text-2xl rounded-2xl border-2 ml-4"
            inputRenomeiaTopico.id = "aberto"
            inputRenomeiaTopico.className = "h-[70%] w-[60%] text-3xl ml-[5%] border-b-2 focus:outline-0 focus:border-b-2"
        
        } else {
            paragrafoTopico.className = "text-4xl px-4 whitespace-nowrap"
            inputCancelarTopico.className = "text-[0%]"
            inputRenomeiaTopico.id = "fechado"
            inputRenomeiaTopico.value = ""
            inputRenomeiaTopico.className = "h-0 w-0 text-[0%]"
        }
    }

    async function atualizarTopico(e: any, idTopico: string) {
        if (e.key === "Enter") {
            const csrf_token = await cookieStore.get("csrftoken")
            const token_jwt = await cookieStore.get("jwt")

            await fetch(`${backend}/topicos/atualizarTopico/`, {
                method: "PATCH",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                credentials: "include",
                body: JSON.stringify({
                    id_topico: idTopico,
                    novo_nome: e.target.value
                })

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                const res_json = await res.json()

                if (res.status === 200) {
                    e.target!.parentElement!.children[2].textContent = e.target.value

                    e.target!.parentElement!.children[1]

                    // Abrindo o paragrafo
                    e.target!.parentElement!.children[2].className = "text-4xl px-4 whitespace-nowrap"
                    
                    // Tirando o botão cancelar
                    e.target!.parentElement!.children[1].className = "text-[0%]"

                    // Configurando o input para renomeia o tópico
                    e.target!.parentElement!.children[0].id = "fechado"
                    e.target!.parentElement!.children[0].value = ""
                    e.target!.parentElement!.children[0].className = "h-0 w-0 text-[0%]"

                } else {
                    alert(res_json["erro"])
                }
            })
        }
    }

    async function pegarTopicoAtual(id_topico: string) {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        if (id_topico.length === 0) {
            await fetch(`${backend}/anotacao/pegar_anotacao/`, {
                credentials: "include",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                }

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value , res.status)

                const res_json = await res.json()

                if (res.status === 200) {
                    setDados({
                        ...dados,
                        anotacoes_list: res_json["dados"],
                    })

                    // Pegando e colocando textos do usuario e da ia no frontend

                    await fetch(`${backend}/chatbot_ia/pegar_chats_antigo/`, {
                        headers: {
                            "X-CSRFToken": csrf_token?.value ?? "",
                            "Authorization": `Bearer ${token_jwt?.value}`
                        },
                        credentials: "include"

                    }).then(async res => {

                        // Verificando se o usuário está dentro do rate limit
                        verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

                        const res_json = await res.json()

                        if (res.status === 200) {
                            setListaMensagensIa(res_json["valor"])

                        } else {
                            alert(res_json["erro"])
                        }
                    })

                } else {
                    if (res_json["erro"] != undefined) {
                        alert(res_json["erro"])

                        if (res_json["erro"] === "Ocorreu um erro o token de login e inválido" || res_json["erro"] === "usuário inválido") {
                            sair_usuario()
                        }
                    }
                }
            })

        } else {
            await fetch(`${backend}/anotacao/pegar_topico_anotacao/?id_topicos=${id_topico}`, {
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                credentials: "include",

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

                const res_json = await res.json()

                if (res.status === 200) {
                    setDados({
                        ...dados,
                        anotacoes_list: res_json["valor"]
                    })                

                } else {
                    alert(res_json["erro"])
                }

            })
        }

    }

    // Deleta o tópico atual
    async function apagarTopico(idTopico: string, e: any) {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        // div de tópicos
        const divTopico: HTMLElement = e.target!.parentElement!.parentElement!.parentElement

        // elemento dos 3 pontinhos
        const buttonTresPontinhos: HTMLElement = e.target!.parentElement!.parentElement!.children[0]

        // Quando estive na função ele vai fechar o menu de seleções
        setMenuAbertoSelectTopico(null)

        // Rota para deletar o tópico selecionado
        await fetch(`${backend}/topicos/apagarTopico/`, {
            method: "DELETE",
            headers: {
                "X-CSRFToken": csrf_token?.value ?? "",
                "Authorization": `Bearer ${token_jwt?.value}`
            },
            credentials: "include",
            body: JSON.stringify({
                id_topico: idTopico
            })

        }).then(async res => {

            // Verificando se o usuário está dentro do rate limit
            verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

            const res_json = await res.json()

            if (res.status === 200) {
                // Tirando da tela a div de tópicos
                divTopico.className = "h-[0%] w-[0%]"

                // Tirando os 3 pontinhos
                buttonTresPontinhos.className="text-[0%] w-0 h-0"

                // Configurando para voltar para todos os tópicos
                setIdTopicoAtual("")
                pegarTopicoAtual("")
                setNomeTopicoAtual("Todos")
                setAbrirMenuTopicos({abrir: false})
                
                alert("topico apagado com sucesso")

            } else {
                alert(res_json["erro"])
            }

        })
    }

    // Opção para excluir o renomeia os topicos
    // Aqui vamos pegar o id para saber qual topico e o atual do listaTopicos
    const [ menuAbertoSelectTopico, setMenuAbertoSelectTopico ] = useState<number | null>(null);

    // Seta o número do listaTopicos atual
    const toggleMenu = (index: number) => {
        // Se clicar no que já está aberto, ele fecha. Se não, abre o novo.
        setMenuAbertoSelectTopico(menuAbertoSelectTopico === index ? null : index);
    };

    useEffect(() => {
        // Pegando anotações
        async function main() {
            const csrf_token = await cookieStore.get("csrftoken")
            const token_jwt = await cookieStore.get("jwt")

            await fetch(`${backend}/anotacao/pegar_anotacao/`, {
                credentials: "include",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                }

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

                const res_json = await res.json()

                if (res.status === 200) {
                    setDados({
                        ...dados,
                        anotacoes_list: res_json["dados"],
                    })

                    // Pegando e colocando textos do usuario e da ia no frontend

                    await fetch(`${backend}/chatbot_ia/pegar_chats_antigo/`, {
                        headers: {
                            "X-CSRFToken": csrf_token?.value ?? "",
                            "Authorization": `Bearer ${token_jwt?.value}`
                        },
                        credentials: "include"

                    }).then(async res => {

                        // Verificando se o usuário está dentro do rate limit
                        verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

                        const res_json = await res.json()

                        if (res.status === 200) {
                            setListaMensagensIa(res_json["valor"])

                        } else {
                            alert(res_json["erro"])
                        }
                    })

                } else {
                    if (res_json["erro"] != undefined) {
                        alert(res_json["erro"])

                        if (res_json["erro"] === "Ocorreu um erro o token de login e inválido" || res_json["erro"] === "usuário inválido") {
                            sair_usuario()
                        }
                    }
                }
            })

            // Pegando a lista de topicos do usuário
            await fetch(`${backend}/topicos/pegar_topicos/`, {
                credentials: "include",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                }

            }).then(async res => {

                // Verificando se o usuário está dentro do rate limit
                verificar_rate_limit(csrf_token?.value, token_jwt?.value, res.status)

                const res_json = await res.json()

                if (res.status === 200) {
                    setListaTopicos(res_json["valor"])

                } else {
                    alert(res_json["erro"])
                }
            })
        }

        main()

    }, [])

    return (
        <div className="h-[100dvh] flex bg-orange-100">

            {/* Tela de adicionar um novo topico */}
            <div className={`${criarTopico.abrir ? "h-[100dvh] w-[100dvw] z-30" : "h-[0dvh] w-[0dvw]"} fixed`}>
                <div className="h-[60%] w-[100%] rounded-3xl xl:w-[35%] mt-[20dvh] xl:ml-[32.5%] bg-white">
                    <div className="h-[80%] overflow-hidden">
                        <h1 className="text-6xl text-center font-bold mt-7">Criar tópico</h1>

                        <p className="text-2xl xl:text-4xl mt-5 pl-[5%] pr-[5%]">Insira um nome para o tópico:</p>
                        <input onChange={e => setCriarTopico({...criarTopico, topico: e.target.value})} value={criarTopico.topico} className="xl:h-20 h-14 xl:text-4xl text-2xl rounded-2xl border-2 p-4 w-[90%] mt-4 ml-[5%]" type="text" placeholder="Insira o nome para o tópico:" />
                    </div>

                    <div className="h-[20%] border-t-2 flex items-center justify-end">
                        <input onClick={() => setCriarTopico({...criarTopico, abrir: false, topico: ""})} className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200 active:bg-gray-200" id="aberto" type="button" value="Cancelar" />
                        <input onClick={() => criarEnviarTopico("")} className="h-14 w-24 rounded-2xl border-2 border-black xl:mr-10 mr-6 text-white bg-red-800 hover:bg-red-600 active:bg-red-600" id="aberto" type="button" value="Enviar" />
                    </div>
                </div>
            </div>

            {/* Tela excluir mensagem */}
            {/* Div corpo */}
            <div ref={elemento_abre_fechar} className="h-[0dvh] w-[0dvw] fixed">
                <div className="h-[60%] w-[100%] rounded-3xl xl:w-[35%] mt-[20dvh] xl:ml-[32.5%] bg-white">
                    <div className="h-[80%] overflow-hidden">
                        <p className="mt-10 text-3xl pl-5">{abreFecharJanela.mensagem_1}<br />
                            {abreFecharJanela.mensagem_2}</p>
                    </div>
                    <div className="h-[20%] border-t-2 flex items-center justify-end">
                        {/* Em desenvolvimento */}
                        {/* <button className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200">
                            <p>Remover <br /> fundo</p>
                        </button> */}
                        <input onClick={e => abre_fechar(e, "")} className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200 active:bg-gray-200" id="aberto" type="button" value="Cancelar" />
                        <input onClick={e => { deletar_anotacao(false); abre_fechar(e, "") }} className="h-14 w-24 rounded-2xl border-2 border-black xl:mr-10 mr-6 text-white bg-red-800 hover:bg-red-600 active:bg-red-600" id="aberto" type="button" value="Excluir" />
                    </div>
                </div>
            </div>

            {/* Parte de Tópicos */}
            <div className={`h-full xl:w-[30%] w-[100%] xl:ml-0 ${abrirMenuTopicos.abrir ? "ml-0" : "ml-[-100%]"} transition-all dura duration-500 ease-in-out fixed xl:static flex flex-col bg-white xl:border-r-2 border-0 z-20`}>
                <input onClick={() => setAbrirMenuTopicos({abrir: false})} className="xl:text-[0%] text-5xl ml-[80%] xl:mt-0 mt-2 rotate-[180deg]" type="button" value="⮕" />

                <h1 className="text-7xl xl:mt-14 mt-0 text-center">Tópicos</h1>

                <div onClick={() => {setIdTopicoAtual(""); pegarTopicoAtual(""); setNomeTopicoAtual("Todos"); setAbrirMenuTopicos({abrir: false})}} className="h-16 w-[95%] flex items-center overflow-y-hidden ml-[2.5%] mt-8 border-2 rounded-4xl hover:bg-gray-300 active:bg-gray-300 cursor-pointer">
                    <p className="text-4xl px-4 whitespace-nowrap">Todos</p>
                </div>

            {listaTopicos.map((item, index) => (
                <div key={index} onClick={() => {setNomeTopicoAtual(item["nome_topico"]); setAbrirMenuTopicos({abrir: false})}} className="relative h-16 w-[95%] flex border-2 rounded-4xl mt-8 ml-[2.5%] hover:bg-gray-300 active:bg-gray-300 cursor-pointer">
                    
                    {/* Lado Esquerdo: Conteúdo principal */}
                    <div 
                        onClick={() => {setIdTopicoAtual(item["id"]); pegarTopicoAtual(item["id"])}} 
                        className="h-16 w-[90%] flex items-center overflow-y-hidden"
                    >
                        <input onKeyDown={e => atualizarTopico(e, item["id"])} onClick={e => e.stopPropagation()} className="h-0 w-0 text-[0%]" id="fechado" type="text" />
                        <input onClick={e => {e.stopPropagation(); abreeFecharInputRenomeiaTopico(e)}} className="text-[0%]" id="cancelar" type="button" value="Cancelar" />
                        <p className="text-4xl px-4 whitespace-nowrap">{item["nome_topico"]}</p>
                    </div>

                    {/* Botão de Opções */}
                    <div className="w-[10%] flex items-center justify-center relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                toggleMenu(index);
                            }}
                            className="text-3xl hover:bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                        >
                            ⋮
                        </button>

                        {/* MENU COM CLICK-AWAY */}
                        {menuAbertoSelectTopico === index && (
                            <>
                                {/* 1. Overlay invisível que cobre toda a tela */}
                                <div 
                                    className="fixed inset-0 z-10 cursor-default" 
                                    onClick={() => setMenuAbertoSelectTopico(null)}
                                ></div>

                                {/* 2. O Menu propriamente dito (agora com z-20 para ficar acima do overlay) */}
                                <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-150">
                                    <button onClick={e => {abreeFecharInputRenomeiaTopico(e); e.stopPropagation()}} className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-gray-100 text-base">
                                        <span>✏️</span> Renomear
                                    </button>
                                    <hr className="my-1 border-gray-100" />
                                    <button onClick={e => apagarTopico(item["id"], e)} className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-gray-100 text-base text-red-500 font-medium">
                                        <span>🗑️</span> Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}
            </div>

            <form className="h-[100%] xl:w-[40%] w-[100%] z-10 overflow-hidden ml-0 bg-cover bg-no-repeat bg-[url(./assets/bg_home.jpg)]">

                <input onClick={() => setAbrirMenuTopicos({abrir: true})} className="xl:text-[0%] text-5xl ml-5" type="button" value="⮕" />

                <div className={`fixed bottom-[6dvh] ml-[5%] xl:w-[30%] w-[90%] bg-orange-400 rounded-3xl transition-all duration-200 ease-in-out ${aberta ? "h-[80%]" : "h-[5%]"}`}>
                    <div onClick={e => e.stopPropagation()} className={`bg-white rounded-t-3xl ${aberta ? "h-[83%]" : "h-0"} cursor-default`}>
                        <nav className="h-[15%] flex items-center rounded-t-3xl bg-orange-400">
                            <img className="h-[80%] xl:w-[15.7%] w-[18%] xl:ml-15 ml-6 rounded-full" src={icone_iamai} alt="Avatar Iamai" />
                            <h1 className={`ml-5 ${aberta ? "text-4xl" : "text-[0%]"}`}>Iamai</h1>
                        </nav>

                        <div className="h-[75.4%] overflow-x-hidden">
                            {/* Id comentario do ia padrão */}
                            <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>Olá senhor(a)! Eu sou a Iamai, uma assistente virtual com uma personalidade alegre e brincalhona! Como você pode ver, tenho um visual bem anime, com meus cabelos longos e lisos em tom avermelhado/louro acobreado, uma franja que molda meu rosto, olhos grandes e rosados/avermelhados, e um lindo laço escuro preso atrás da cabeça. Minhas cores favoritas são o laranja e o roxo! Minha profissão é auxiliar usuários em um aplicativo de anotações. Comigo, você pode criar e apagar anotações de forma prática e intuitiva. Além disso, caso queira, também é possível apagar sua conta e sair do aplicativo. Devo ressaltar que nosso sistema não conta com nenhum método de recuperação de conta, então é importante ter certeza antes de apagar seus dados. Infelizmente, não tenho acesso direto ao sistema, então não posso interagir com ele diretamente. Mas não se preocupe, estou aqui para tornar sua experiência com o aplicativo a mais agradável possível! Posso conversar com você, responder suas dúvidas e até mesmo fazer brincadeiras para deixar tudo mais divertido. Estou ansiosa para começarmos a trabalhar juntos, senhor(a)!</p>
                            </div>

                            <>
                                {listaMensagensIa.map((item, index) => (
                                    <div key={index}>
                                        {/* Id comentario do usuário */}
                                        <div id="comentario_user" className={`${aberta ? "bg-gray-400 mt-10 mb-10 xl:ml-[10%] ml-[15%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                            <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>{item.mensagem_usuario}</p>
                                        </div>

                                        {/* Id comentario do ia */}
                                        <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                            <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>{item.mensagem_ia}</p>
                                        </div>
                                    </div>
                                ))}
                            </>

                            {/* Mensagem de carregando */}
                            {userMensagem.carregando ?
                                <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                    <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>Carregando resposta</p>
                                </div>
                                :
                                <div></div>
                            }
                        </div>

                        {/* Aba de escrever e enviar o chat da ia */}
                        <div className="h-[10%] flex justify-center items-center">
                            <div className={`h-[80%] w-[90%] flex rounded-2xl ${aberta ? "border-2" : ""}`}>
                                <input onChange={e => setUserMensagem({ ...userMensagem, mensagem: e.target.value })} className="h-[100%] w-[80%] text-2xl pl-3 pr-3 focus:outline-0" type="text" placeholder="Insira uma mensagem:" value={userMensagem.mensagem} />
                                <input onClick={() => pegar_mensagem_ia()} className="xl:w-[17.8%] w-[16.3%] bg-cover bg-no-repeat bg-[url(./assets/aviao-de-envio.png)]" type="button" value="" />
                            </div>
                        </div>
                    </div>

                    {/* Aba de apagar o chat da ia */}
                    <div className={`${aberta ? "h-[10%]" : "h-0"} flex justify-center items-center`}>
                        <p className={`${aberta ? "xl:text-2xl text-[100%]" : "text-[0%]"} text-white`}>Apagar chat da conversar</p>
                        <input onClick={e => abre_fechar(e, "historico_chat")} className="h-[80%] w-24 xl:ml-5 ml-3 xl:text-2xl text-[100%] text-white rounded-2xl bg-gray-500 hover:bg-gray-600" id="fechado" type="button" value="Apagar" />
                    </div>

                    <div className={`w-full flex items-center ${aberta ? "h-[7%]" : "h-full"}`}>
                        <input onClick={() => setAberta(!aberta)} className={`h-[80%] w-14 ml-5 rounded-2xl bg-cover bg-no-repeat bg-[url(./assets/Triangulo.png)] cursor-pointer transition-transform duration-1 ease-in-out ${aberta ? "rotate-[180deg]" : "rotate-[0deg]"}`} type="button" value="" />
                    </div>
                </div>

                <div className="h-10 xl:mt-5 mt-0 flex z-10">
                    <input onChange={e => pega_dados(e)} className="h-20 w-[75%] ml-4 border-b-2 p-2 lg:text-4xl text-[140%] outline-none" id="anotacao" value={dados.anotacao} placeholder="Insira uma anotação" type="text" />

                    <input onClick={() => enviar_anotacao("humano", "")} className="h-16 w-40 mt-2 ml-2 border-2 rounded-4xl text-3xl text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" type="button" value="Enviar" />
                </div>

                {/* Botões sair, apagar conta e criar tópico da versão mobile */}
                <div className="h-10 w-[100%] xl:mt-0 mt-12 flex items-center justify-end align-middle">
                    <input onClick={() => setCriarTopico({...criarTopico, abrir: true})} className="h-8 lg:h-14 xl:w-0 w-32 xl:border-0 border-2 lg:text-4xl rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" id="fechado" type="button" value="Criar tópico" />
                    
                    <input onClick={e => abre_fechar(e, "apagar_usuário")} className="h-8 lg:h-14 xl:w-0 w-32 xl:border-0 border-2 lg:text-4xl rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" id="fechado" type="button" value="Apagar conta" />

                    <input onClick={() => sair_usuario()} className="h-8 lg:h-14 xl:w-0 w-32 xl:border-0 border-2 lg:text-4xl rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" type="button" value="Sair" />

                </div>

                <div className="h-24 w-full overflow-y-hidden text-center flex items-center">
                    <h1 className="xl:text-4xl text-[185%] pl-5 pr-5 whitespace-nowrap">Nome do tópico atual: {nomeTopicoAtual}</h1>
                </div>

                {/* Corpo aonde vai ficar as mensagens */}
                <div className="h-[74%] lg:h-[85.6%] overflow-y-auto overflow-x-hidden mt-[2%]">
                    {/* Anotações de anotações */}
                    {dados.anotacoes_list.map((value, i) => {
                        return (
                            <div key={i}>
                                <div className={`h-80 w-[75%] ml-12 mt-4 m rounded-3xl ${i === dados.anotacoes_list.length - 1 ? "xl:mb-[33%] mb-[40%]" : ""} overflow-x-auto bg-[url(./assets/Folhas-de-anotacoes.jpg)] bg-cover bg-no-repeat`}>
                                    {/* Div 1 */}
                                    <div className="h-16 flex items-center justify-end">
                                        {/* Pegando a data e colocando ela em dia mes e ano */}
                                        <p className="text-2xl mr-7">{value["data"].split("-")[2] + "/" + value["data"].split("-")[1] + "/" + value["data"].split("-")[0]}</p>
                                        <input onClick={e => { setDados({ ...dados, id_anotacao_apagar: value["id"] }); abre_fechar(e, "mensagem") }} className="h-[70%] w-20 mr-7 text-3xl border-2 rounded-3xl bg-red-800 hover:bg-red-700 active:bg-red-700" id="fechado" type="button" value="X" />
                                    </div>

                                    {/* Div 2 */}
                                    <div className="h-[80%] w-[90%] ml-8 overflow-x-hidden">
                                        <p className="text-4xl">{value["anotacao"]}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </form>

            {/* Botões mudar apagar conta, sair e criar tópico da versão desktop */}
            <div className="h-20 xl:w-auto w-0 flex items-center justify-end align-middle">
                {/* Em desenvolvimento */}
                <input onClick={() => setCriarTopico({...criarTopico, abrir: true})} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" type="button" value="Criar tópico" />

                <input onClick={e => abre_fechar(e, "apagar_usuário")} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" id="fechado" type="button" value="Apagar conta" />

                <input onClick={() => sair_usuario()} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" type="button" value="Sair" />

            </div>
        </div>
    )
}