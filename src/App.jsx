import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Markdown from "react-markdown";
import { useChatCompletion } from "./hooks/useChatCompletion";
import { cleanInstructions } from "./utils/utils";
import { database } from "./database/setup";
import SettingsModal from "./components/SettingsModal";
import ResponsesModal from "./components/ResponsesModal";
import ModifyInstructionsModal from "./components/ModifyInstructionsModal";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import "./example.css";

const original = `You must reword what people are saying in order to maximize clarity and concise language...`;

const App = () => {
  const [instructions, setInstructions] = useState(original);
  const [promptText, setPromptText] = useState("");
  const { messages, submitPrompt } = useChatCompletion();
  const [showModal, setShowModal] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [responses, setResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [filterText, setFilterText] = useState("");

  const onSend = () => {
    submitPrompt([{ content: instructions + " " + promptText, role: "user" }]);
    setPromptText("");
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleShowResponsesModal = () => {
    setShowResponsesModal(true);
    loadResponses();
  };

  const handleCloseResponsesModal = () => setShowResponsesModal(false);

  const handleSaveInstructions = async (newInstructions) => {
    if (uniqueId) {
      const userDocRef = doc(database, "users", uniqueId);
      await updateDoc(userDocRef, { instructions: newInstructions });
      setInstructions(newInstructions);
    }
  };

  const saveResponse = async (msg) => {
    if (uniqueId) {
      const userDocRef = doc(database, "users", uniqueId);
      const responsesCollectionRef = collection(userDocRef, "responses");
      await addDoc(responsesCollectionRef, {
        title: "Untitled",
        content: cleanInstructions(msg.content, instructions),
        role: msg.role,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const loadResponses = async () => {
    if (uniqueId) {
      const userDocRef = doc(database, "users", uniqueId);
      const responsesCollectionRef = collection(userDocRef, "responses");
      const responseDocs = await getDocs(responsesCollectionRef);
      const responsesData = responseDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setResponses(responsesData);
      setFilteredResponses(responsesData);
    }
  };

  const connectDID = async () => {
    try {
      let id = localStorage.getItem("uniqueId");
      if (!id) {
        const { web5 } = await Web5.connect();
        id = web5?.did?.agent?.agentDid;
        localStorage.setItem("uniqueId", id);
        await setDoc(doc(database, "users", id), {
          uniqueId: id,
          createdAt: new Date().toISOString(),
        });
      }
      setUniqueId(id);
      loadUserInstructions(id);
    } catch (error) {
      console.log("error", error);
    }
  };

  const loadUserInstructions = async (id) => {
    const userDocRef = doc(database, "users", id);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().instructions) {
      setInstructions(docSnap.data().instructions);
    } else {
      setInstructions(original);
    }
  };

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
    connectDID();
  }, [messages]);

  return (
    <>
      <div className="chat-wrapper">
        <h1>Say Less.</h1>
        <small>
          <b>
            An assistant to help you clarify and improve your business language.
          </b>
        </small>
        {messages.length < 1 ? (
          <div className="empty"></div>
        ) : (
          messages.map((msg, i) => (
            <div className="message-wrapper" key={i}>
              <div>
                {msg.role === "assistant" ? (
                  <>
                    <Markdown>{msg.content}</Markdown>
                    <Button
                      variant="dark"
                      size="sm"
                      onMouseDown={() => saveResponse(msg)}
                    >
                      Save response
                    </Button>
                  </>
                ) : (
                  <>
                    <b>You</b>
                    <Markdown>
                      {cleanInstructions(msg.content, instructions)}
                    </Markdown>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="prompt-wrapper">
        <div>
          <textarea
            value={promptText}
            placeholder="Message"
            onChange={(event) => setPromptText(event.target.value)}
            disabled={
              messages.length > 0 && messages[messages.length - 1].meta.loading
            }
          />
          <button onMouseDown={onSend}>&#8679;</button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <br />
          <br />
          <button onMouseDown={handleShowModal}>Modify</button>
          <button onMouseDown={handleShowResponsesModal}>Saved</button>
          <button onMouseDown={() => setShowSettingsModal(true)}>
            Settings
          </button>
        </div>
      </div>

      <ModifyInstructionsModal
        show={showModal}
        handleClose={handleCloseModal}
        originalInstructions={instructions}
        saveInstructions={handleSaveInstructions}
      />

      <ResponsesModal
        show={showResponsesModal}
        handleClose={handleCloseResponsesModal}
        uniqueId={uniqueId}
      />

      <SettingsModal
        show={showSettingsModal}
        handleClose={() => setShowSettingsModal(false)}
        updateUserId={(id) => {
          setUniqueId(id);
          loadUserInstructions(id);
        }}
      />
    </>
  );
};

export default App;
