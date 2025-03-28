'use client' // Indica que este código está sendo executado no lado do cliente

import { useState } from 'react' // Importa o hook useState do React

const empresas = [
  { id: 1, nome: '01-Jaboticabal', matriz: 1, filial: null },
  { id: 2, nome: '03-Pradopolis', matriz: 3, filial: null },
  { id: 3, nome: '04-Monte alto', matriz: 4, filial: null },
  { id: 4, nome: '05-Guariba 2', matriz: 5, filial: null },
  { id: 5, nome: '06-Jaboticabal', matriz: 6, filial: 1 },
  { id: 6, nome: '06-Jaboticabal', matriz: 6, filial: null }
]

export default function Home() {
  const [file, setFile] = useState(null) // Cria um estado para armazenar o arquivo carregado
  const [fileName, setFileName] = useState('Selecione um arquivo')
  const [csvData, setCsvData] = useState(null) // Cria um estado para armazenar os dados CSV gerados
  const [nomeArquivo, setNomeArquivo] = useState('') // Cria um estado para armazenar o nome do arquivo
  const [loja, setLoja] = useState('') // Cria um estado para armazenar o número da loja
  const [filial, setFilial] = useState('') // Cria um estado para armazenar o número da loja
  const [uniqueItems, setUniqueItems] = useState([]) // Cria um estado para armazenar os itens únicos
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null) // Estado da empresa selecionada

  // Função para manipular o upload de arquivos
  const handleFileUpload = e => {
    const file = e.target.files[0]
    setFile(file) // Atualiza o estado do arquivo com o arquivo carregado pelo usuário
    if (file) {
      setFileName(file.name)
    } else {
      setFileName('Selecione um arquivo')
    }
  }

  // Função para manipular a mudança no select de empresa
  const handleEmpresaChange = e => {
    const idEmpresa = parseInt(e.target.value) // Obtém o ID da empresa
    const empresa = empresas.find(emp => emp.id === idEmpresa) // Busca os dados da empresa no array

    if (empresa) {
      setEmpresaSelecionada(empresa)
      setLoja(empresa.matriz) // Atribui o valor da matriz à variável loja
      setFilial(empresa.filial ? empresa.filial : null) // Atribui o valor da filial (ou vazio, se não existir)
    }
  }

  // Função para converter o arquivo TXT para CSV
  const handleFileConvert = () => {
    const reader = new FileReader() // Cria uma nova instância do FileReader
    reader.onload = event => {
      const text = event.target.result // Obtém o conteúdo do arquivo carregado
      const lines = text.split('\n').filter(line => line.trim() !== '') // Divide o conteúdo do arquivo em linhas e filtra linhas vazias

      let arrayClean = lines.map(line => [
        line.slice(0, 6).replace(/^(\d{2})(\d{2})(\d{2})$/, '$1/$2/20$3'), // Formata a data
        line.slice(18, 118).trim().toUpperCase(), // Formata a Descrição
        line
          .slice(118, 133)
          .replace(/^0+/, '')
          .replace(/(\d+)(\d{2})$/, '$1,$2'), // Formata o Valor
        line.slice(148, 161).trim().replace(/^0+/, ''), // Formata a Tipo de conta
        line.slice(177, 190).trim().replace(/^0+/, '') // Formata a Número da conta
      ])

      // Recria o array com os dados que são precisos para gerar o arquivo
      arrayClean.forEach((row, i) => {
        arrayClean[i] = [
          row[0], // Data
          row[1], // Descrição
          parseFloat(row[2].replace(',', '.')), // Converte o valor para número para poder ordenar depois
          row[3] ? 'D' : 'C', // Determina o tipo de conta (D para débito, C para crédito)
          row[3] || row[4] // Número da conta dependendo a conta que existir
        ]
      })

      // Cria um mapa para contar as ocorrências de cada descrição
      const itemMap = new Map()
      arrayClean.forEach(row => {
        const key = row[1]
        if (itemMap.has(key)) {
          itemMap.set(key, itemMap.get(key) + 1)
        } else {
          itemMap.set(key, 1)
        }
      })

      const nomeArquivo = filial
        ? `Loja ${loja} Filial ${filial} ${arrayClean[0][0]} `
        : `Loja ${loja} ${arrayClean[0][0]}` // Gera o nome do arquivo com base na loja e na data
      setNomeArquivo(nomeArquivo) // Atualiza o estado do nome do arquivo
      console.log(loja)
      console.log(filial)
      console.log(nomeArquivo)
      // Ordenando por valor
      arrayClean.sort((a, b) => a[2] - b[2]) // Ordena as linhas pelo valor para ficar mais fácil de ver se falta alguma entrada

      // Filtra os itens que não têm um par
      const uniqueItems = arrayClean
        .filter(row => {
          const key = row[1]
          return itemMap.get(key) % 2 !== 0
        })
        .map(row => ({ descricao: row[1], valor: row[2].toFixed(2).replace('.', ',') })) // Retorna apenas descrição e valor
      setUniqueItems(uniqueItems)

      // Construindo a saída conforme especificação
      let outputLines = []
      outputLines.push(`0|F`) // Primeira linha fixa
      outputLines.push(`1|${loja}|${arrayClean[0][0]}|1||${nomeArquivo}|N|`) // Segunda linha com informações da loja e data, como a data é sempre a mesma uso primeiro item do array
      arrayClean.forEach(row => {
        const valor = row[2].toFixed(2).replace('.', ',') // Converte o valor de volta para string no formato adequado
        if (row[4] == '42101007') {
          // aqui é o if da conta que precisa de uma linha a mais
          outputLines.push(`2|${row[4]}|${row[3]}|${valor}|${row[1]}`) // Linha para contas específicas
          outputLines.push(`3|E|${filial ? filial : loja}`) // Linha adicional 1
          outputLines.push(`3|T|7`) // Linha adicional 2
        } else {
          outputLines.push(`2|${row[4]}|${row[3]}|${valor}|${row[1]}`) // Linha padrão
          outputLines.push(`3|E|${filial ? filial : loja}`) // Linha adicional
        }
      })

      const csvOutput = outputLines.join('\n') // Junta todas as linhas em uma string
      setCsvData(csvOutput) // Atualiza o estado com os dados CSV gerados
    }
    reader.readAsText(file) // Lê o arquivo como texto
  }

  // Função para baixar o arquivo CSV
  const handleDownload = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' }) // Cria um blob com os dados CSV
    const link = document.createElement('a') // Cria um link
    link.href = URL.createObjectURL(blob) // Cria uma URL para o blob
    link.download = `${nomeArquivo}.csv` // Define o nome do arquivo para download
    link.click() // Simula um clique no link para iniciar o download
  }

  return (
    <div className="container">
      <h1>Conversor folha</h1>
      <div className="fields">
        <label>Arquivo da Senior:</label>
        <div className="file-input-container">
          <input type="file" id="file-input" className="file-input" onChange={handleFileUpload} />
          <label htmlFor="file-input" className="file-input-label">
            {fileName}
          </label>
        </div>
        <div className="inputs">
          {/* Select Único para Empresas */}
          <div className="field">
            <select onChange={handleEmpresaChange} defaultValue="">
              <option value="">Selecione uma empresa</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={handleFileConvert} disabled={!file || !loja}>
          Converter
        </button>
        {csvData && (
          <>
            <button onClick={handleDownload}>Baixar arquivo</button>
          </>
        )}
      </div>
      <div className="resultado">
        {uniqueItems.length > 0 && (
          <>
            <h2>Itens Únicos</h2>
            {uniqueItems.map((item, index) => (
              <p key={index}>{` ${item.descricao} R$:${item.valor}`}</p>
            ))}
          </>
        )}
        {csvData && (
          <>
            <h2>Resultado:</h2>
            <pre>{csvData}</pre>
          </>
        )}
      </div>
    </div>
  )
}
