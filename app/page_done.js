'use client' // Indica que este código está sendo executado no lado do cliente

import { useState } from 'react' // Importa o hook useState do React

export default function Home() {
  const [file, setFile] = useState(null) // Cria um estado para armazenar o arquivo carregado
  const [fileName, setFileName] = useState('Selecione um arquivo')
  const [csvData, setCsvData] = useState(null) // Cria um estado para armazenar os dados CSV gerados
  const [nomeArquivo, setNomeArquivo] = useState('') // Cria um estado para armazenar o nome do arquivo
  const [loja, setLoja] = useState('') // Cria um estado para armazenar o número da loja
  const [filial, setFilial] = useState('') // Cria um estado para armazenar o número da loja

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

  // Função para manipular a mudança no input da loja
  const handleLojaChange = e => {
    setLoja(e.target.value) // Atualiza o estado da loja com o valor digitado pelo usuário
  }

  // Função para manipular a mudança no input da filial
  const handleFilialChange = e => {
    setFilial(e.target.value) // Atualiza o estado da filial com o valor digitado pelo usuário
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
          row[3] || row[4] // Número da conta dependendo a cont que existir
        ]
      })

      const nomeArquivo = filial
        ? `Loja ${loja} Filial ${filial} ${arrayClean[0][0]} `
        : `Loja ${loja} ${arrayClean[0][0]}` // Gera o nome do arquivo com base na loja e na data
      setNomeArquivo(nomeArquivo) // Atualiza o estado do nome do arquivo

      console.log(arrayClean[0])

      // Ordenando por valor
      arrayClean.sort((a, b) => a[2] - b[2]) // Ordena as linhas pelo valor para ficar mais facil de ver se falta alguma entrada

      // Construindo a saída conforme especificação
      let outputLines = []
      outputLines.push(`0|F`) // Primeira linha fixa
      outputLines.push(`1|${loja}|${arrayClean[0][0]}|1||${nomeArquivo}|N|`) // Segunda linha com informações da loja e data, como a data é sempre a mesma uso primeiro item do array
      arrayClean.forEach(row => {
        const valor = row[2].toFixed(2).replace('.', ',') // Converte o valor de volta para string no formato adequado
        if (row[4] == '42101007') {
          //aqui é o if da conta que precisa de uma linha a mais
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
          <div className="field">
            <label>N° da empresa matriz:</label>
            <input
              type="text"
              placeholder="Número da Loja Matriz"
              value={loja}
              onChange={handleLojaChange}
            />
          </div>
          <div className="field">
            <label>N° da empresa filial:</label>
            <input
              type="text"
              placeholder="Número da Loja filial"
              value={filial}
              onChange={handleFilialChange}
            />
          </div>
        </div>
        <button onClick={handleFileConvert} disabled={!file || !loja}>
          Converter
        </button>
      </div>
      <div className="resultado">
        {csvData && (
          <>
            <button onClick={handleDownload}>Baixar CSV</button>
            <h2>Resultado:</h2>
            <pre>{csvData}</pre>
          </>
        )}
      </div>
    </div>
  )
}
