export default function Alerta(props: any)
{
    function fechar()
    {
        props.passaErro("", "0")
    }

    return (
        <div className={`h-[${props.porcentagem}dvh] w-[${props.porcentagem}dvw] z-50 flex items-center fixed`}>
            <div className={`${props.porcentagem === "100" ? "h-[60%]" : "h-[0%]"} w-[${props.porcentagem}%] ${props.porcentagem === "100" ? "border-2" : "border-0"} rounded-3xl ${props.porcentagem === "100" ? "xl:w-[35%]" : "xl:w-[0%]"} ${props.porcentagem === "100" ? "mt-0" : "mt-[20dvh]"} ${props.porcentagem === "100" ? "xl:ml-[32.5%]" : "xl:ml-0"} bg-white`}>
                <div className={`${props.porcentagem === "100" ? "h-[80%]" : "h-[0%]"} overflow-hidden`}>
                    <p className={`${props.porcentagem === "100" ? "mt-10" : "mt-0"} ${props.porcentagem === "100" ? "text-3xl" : "text-[0%]"} ${props.porcentagem === "100" ? "pl-5" : "pl-0"} pl-5`}>{props.mensagem}</p>
                </div>
                <div className={`${props.porcentagem === "100" ? "h-[20%]" : "h-[0%]"} ${props.porcentagem === "100" ? "border-t-2" : "border-t-0"} flex items-center justify-end`}>
                    <input onClick={() => fechar()} className={`${props.porcentagem === "100" ? "h-14" : "h-[0%]"} ${props.porcentagem === "100" ? "w-24" : "w-[0%]"} rounded-2xl ${props.porcentagem === "100" ? "border-2" : "border-0"} border-black ${props.porcentagem === "100" ? "xl:mr-10" : "xl:mr-0"} ${props.porcentagem === "100" ? "mr-6" : "mr-0"} text-white bg-blue-800 hover:bg-blue-600 active:bg-blue-600`} id="aberto" type="button" value="Confirmar" />
                </div>
            </div>
        </div>
    )
}