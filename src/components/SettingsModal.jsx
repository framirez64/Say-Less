import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  FormControl,
  Alert,
} from "react-bootstrap";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { database } from "../database/setup";

const SettingsModal = ({ show, handleClose, updateUserId }) => {
  const [inputId, setInputId] = useState("");
  const [error, setError] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [accountSwitchSuccess, setAccountSwitchSuccess] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem("uniqueId");
    if (storedId) {
      setCurrentId(storedId);
    }
  }, []);

  const isValidDID = (did) => {
    return /^did:(key|dht|ion):/.test(did);
  };

  const handleSave = async () => {
    if (!isValidDID(inputId)) {
      setError(
        "Invalid DID. Please enter a DID starting with did:key, did:dht, or did:ion."
      );
      setAccountSwitchSuccess(false);

      return;
    }

    try {
      const userDocRef = doc(database, "users", inputId);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uniqueId: inputId,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem("uniqueId", inputId);
      updateUserId(inputId);
      setCurrentId(inputId);
      setAccountSwitchSuccess(true);
      setError("");
    } catch (err) {
      console.error("Error checking user ID:", err);
      setError("An error occurred. Please try again.");
      setAccountSwitchSuccess(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        👋&nbsp;You're using a decentralized identity to instantly launch inside
        of social media. Keep this ID so you can share it across apps or
        networks!
        <br />
        <br />
        {accountSwitchSuccess && (
          <Alert variant="success">Account switched successfully!</Alert>
        )}
        <Form>
          <Form.Group controlId="formCurrentUserId">
            <Form.Label>Current User ID</Form.Label>
            <InputGroup>
              <FormControl
                type="text"
                value={`${currentId.slice(0, 16)}...`}
                readOnly
              />
              <Button variant="outline-secondary" onMouseDown={handleCopy}>
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </InputGroup>
          </Form.Group>
          <br />
          <Form.Group controlId="formUserId">
            <Form.Label>Switch accounts</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter an ID to switch accounts"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
            />
            {error && <small className="text-danger">{error}</small>}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onMouseDown={handleSave}>
          Switch
        </Button>
        <Button
          variant="link"
          href="https://robotsbuildingeducation.com"
          target="_blank"
        >
          Visit RO.B.E
        </Button>
        <Button variant="tertiary" onMouseDown={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettingsModal;
