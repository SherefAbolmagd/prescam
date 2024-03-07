const { readdirSync } = require("fs");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
  RetrievalQAChain,
  ConversationChain,
  ConversationalRetrievalQAChain,
  LLMChain,
  APIChain,
} = require("langchain/chains");
const { VectorStoreRetrieverMemory } = require("langchain/memory");

class Langchain {
  async query(query, instanceId) {
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      openAIApiKey: process.env.OPENAI_KEY,
    });
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_KEY,
    });

    const vectorStore = await HNSWLib.load(
      `documents/${instanceId}/data`,
      embeddings
    );

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({ query });

    console.log("====================================");
    console.log(response);
    console.log("====================================");

    return response.text.trim();
  }
}

const singletonLangchain = new Langchain();

Object.freeze(singletonLangchain);

module.exports = singletonLangchain;
