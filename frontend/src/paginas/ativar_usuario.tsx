import { useState, useEffect } from "react"

export default function Ativar_usuario(props: any)
{
    const backend = props.backend

    interface Frase {
        frase: string
    }

    const [ frase, setFrase ] = useState<Frase | null>({
        frase: ""
    })

    useEffect(() => {
        const query = new URLSearchParams(window.location.search)
        const email = query.get("email")

        fetch(`${backend}/ativar/ativar_usuario/?email=${email}`).then(dados => dados.json()).then(dados => {
            if (dados === true) {
                setFrase({
                    ...frase,
                    frase: "Usuário ativado com sucesso"
                })

            } else {
                alert(dados)
                setFrase({
                    ...frase,
                    frase: "Ocorreu um erro"
                })
            }
        })

    }, [])

    return(
        <div>
            <h1>{frase?.frase}</h1>
        </div>
    )
}