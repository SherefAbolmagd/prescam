const { readdirSync } = require("fs");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAI } = require("langchain/llms/openai");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
  RetrievalQAChain,
  APIChain,
  createOpenAPIChain,
} = require("langchain/chains");
const { GithubRepoLoader } = require("langchain/document_loaders/web/github");
const {
  PuppeteerWebBaseLoader,
} = require("langchain/document_loaders/web/puppeteer");

const baseDirectoryPath = `${__dirname}/../documents`;

const ingest = async (req, res, next) => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_KEY,
  });

  const loader = new DirectoryLoader(`documents/${req.params.instanceId}/`, {
    // ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
    // ".csv": (path) => new CSVLoader(path),
    // ".md": (path) => new TextLoader(path),
  });

  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter();
  // const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const splitDocs = await textSplitter.splitDocuments(docs);

  const vectorStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
  // const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
  await vectorStore.save(`documents/${req.params.instanceId}/data`);

  return res.status(200).json({ status: "Done" });
};

const query = async (req, res, next) => {
  const { query } = req.params;
  console.log("====================================");
  console.log(query);
  console.log("====================================");
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_KEY,
    maxTokens: -1,
    temperature: 1,
  });
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_KEY,
  });

  const vectorStore = await HNSWLib.load(
    `docs/pricelist/index/data`,
    embeddings
  );

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const response = await chain.call({ query });

  return res.status(200).json({
    response: response.text.trim(),
  });
};

const getTopics = async (req, res, next) => {
  const names = readdirSync(baseDirectoryPath, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name);

  return res.status(200).json({
    response: names,
  });
};

module.exports = {
  ingest,
  query,
  getTopics,
};
