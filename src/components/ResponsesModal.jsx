import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Card,
  Row,
  Col,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { database } from "../database/setup";

const ResponsesModal = ({ show, handleClose, uniqueId }) => {
  const [responses, setResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    if (uniqueId) {
      const fetchResponses = async () => {
        const userDocRef = doc(database, "users", uniqueId);
        const responsesCollectionRef = collection(userDocRef, "responses");
        const responseDocs = await getDocs(responsesCollectionRef);
        const responsesData = responseDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setResponses(responsesData);
        setFilteredResponses(responsesData);
      };

      fetchResponses();
    }
  }, [uniqueId]);

  const updateResponse = async () => {
    if (uniqueId && selectedResponse) {
      const userDocRef = doc(database, "users", uniqueId);
      const responseDocRef = doc(userDocRef, "responses", selectedResponse.id);
      await updateDoc(responseDocRef, {
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date().toISOString(),
      });
      const updatedResponses = responses.map((resp) =>
        resp.id === selectedResponse.id
          ? { ...resp, title: editedTitle, content: editedContent }
          : resp
      );
      setResponses(updatedResponses);
      setFilteredResponses(updatedResponses);
      setSelectedResponse(null);
      setEditedContent("");
      setEditedTitle("");
    }
  };

  const filterResponses = (text) => {
    setFilterText(text);
    const formattedText = text.toLowerCase();
    if (text.trim() === "") {
      setFilteredResponses(responses);
    } else {
      setFilteredResponses(
        responses.filter((response) =>
          [
            response.title,
            response.content,
            new Date(response.createdAt).toLocaleString(),
          ].some((field) => field.toLowerCase().includes(formattedText))
        )
      );
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>Saved Responses</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!selectedResponse ? (
          <>
            <label>&nbsp;Filter</label>
            <InputGroup className="mb-3">
              <FormControl
                placeholder="Filter by title, content or date (M/D/Y)"
                value={filterText}
                onChange={(e) => filterResponses(e.target.value)}
              />
            </InputGroup>
          </>
        ) : (
          <Form>
            <Form.Group controlId="formEditTitle">
              <Form.Label>Edit Title</Form.Label>
              <Form.Control
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="formEditContent">
              <Form.Label>Edit Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={12}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            </Form.Group>
            <br />
            <Button variant="dark" onMouseDown={updateResponse}>
              Save Changes
            </Button>
            &nbsp; &nbsp;
            <Button
              variant="tertiary"
              onMouseDown={() => setSelectedResponse(null)}
            >
              Cancel
            </Button>
          </Form>
        )}
        {!selectedResponse && (
          <Row>
            {filteredResponses.map((response) => (
              <Col key={response.id} sm={12} md={6} lg={4} className="mb-3">
                <Card
                  style={{ height: "300px", cursor: "pointer" }}
                  onMouseDown={() => {
                    setSelectedResponse(response);
                    setEditedTitle(response.title);
                    setEditedContent(response.content);
                  }}
                >
                  <Card.Body>
                    <Card.Title>{response.title}</Card.Title>
                    <Card.Text>
                      {response.content.substring(0, 100)}...
                    </Card.Text>
                    <Card.Subtitle className="mb-2 text-muted">
                      {new Date(response.createdAt).toLocaleString()}
                    </Card.Subtitle>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onMouseDown={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResponsesModal;
