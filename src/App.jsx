import { useEffect, useState } from "react";
import { Web5 } from "@web5/api/browser";
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

const original = `You must reword what people are saying in order to maximize clarity and concise language based on the context provided by the user using markdown formatting or else the task and app will fail - no exceptions, it must only be a maximum of 3 statements total in the output response or a minimum of 1 statement, depending on the situation. You'll be helping people improve communications in business settings like meetings, emails, resumes, or products. Additionally, include a few alternatives. Do not elaborate or explain further, simply output the concise language requested. The following context is provided by the user: `;

const App = () => {
  const [instructions, setInstructions] = useState(original);
  const [promptText, setPromptText] = useState("");
  const { messages, submitPrompt } = useChatCompletion();
  const [showModal, setShowModal] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [buttonStates, setButtonStates] = useState({});
  const [responses, setResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);

  const onSend = async () => {
    try {
      setIsSending(true);
      await submitPrompt([
        { content: instructions + " " + promptText, role: "user" },
      ]);
      setPromptText("");
      setIsSending(false);
    } catch (error) {
      alert("failed to run. need to fix this later");
      setPromptText(JSON.stringify({ error }));
      setIsSending(false);
    }
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

  const saveResponse = async (msg, userMsg, messageId) => {
    console.log("MSG", msg);
    if (uniqueId) {
      // Update the button state to "Saving..." for the specific message
      setButtonStates((prev) => ({
        ...prev,
        [messageId]: "Saving...",
      }));

      const userDocRef = doc(database, "users", uniqueId);
      const responsesCollectionRef = collection(userDocRef, "responses");

      await addDoc(responsesCollectionRef, {
        title: "",
        content: cleanInstructions(msg.content, instructions),
        original: promptText, // Store the original user message
        role: msg.role,
        createdAt: new Date().toISOString(),
        userMsg: cleanInstructions(userMsg?.content, instructions),
      });

      // Update the button state to "Saved" after saving
      setButtonStates((prev) => ({
        ...prev,
        [messageId]: "Saved",
      }));

      // Reset the button text after 2 seconds
      setTimeout(() => {
        setButtonStates((prev) => ({
          ...prev,
          [msg.id]: "Save response",
        }));
      }, 2000);

      // Load responses to update the modal
      loadResponses();
    }
  };

  const loadResponses = async () => {
    if (uniqueId) {
      const userDocRef = doc(database, "users", uniqueId);
      const responsesCollectionRef = collection(userDocRef, "responses");
      const responseDocs = await getDocs(responsesCollectionRef);
      const responsesData = responseDocs.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation time
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
    connectDID();
  }, []);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
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
          messages.map((msg, i) => {
            const messageId = msg.id || `msg-${i}`;

            return (
              <div className="message-wrapper" key={messageId}>
                <div>
                  {msg.role === "assistant" ? (
                    <div
                      style={{
                        backgroundColor: "#F0F0F0",
                        borderRadius: 24,
                        padding: 24,
                      }}
                    >
                      <Markdown>{msg.content}</Markdown>
                      <Button
                        variant="dark"
                        size="sm"
                        onMouseDown={() =>
                          saveResponse(msg, messages[i - 1], messageId)
                        }
                      >
                        {buttonStates[messageId] || "Save response"}
                      </Button>
                      <hr />
                    </div>
                  ) : (
                    <div>
                      {msg.role === "user" ? <b>Message</b> : null}
                      <Markdown>
                        {cleanInstructions(msg.content, instructions)}
                      </Markdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
          <Button variant="light" onMouseDown={onSend} disabled={isSending}>
            &#8679;
          </Button>
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
          <Button size="sm" variant="tertiary" onMouseDown={handleShowModal}>
            Modify
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            onMouseDown={handleShowResponsesModal}
          >
            Saved
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            onMouseDown={() => setShowSettingsModal(true)}
          >
            Settings
          </Button>
        </div>
      </div>

      <ModifyInstructionsModal
        show={showModal}
        handleClose={handleCloseModal}
        instructions={instructions}
        saveInstructions={handleSaveInstructions}
        original={original}
      />

      <ResponsesModal
        show={showResponsesModal}
        handleClose={handleCloseResponsesModal}
        uniqueId={uniqueId}
        loadResponses={loadResponses} // Pass the loadResponses function to the modal
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
