import React from "react";
import { Redirect } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { CSVReader } from 'react-papaparse';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import { GoChevronDown, GoCheck } from 'react-icons/go';
import Spinner from 'react-bootstrap/Spinner';
import API from '../api/Api';

const fileProps = new Map([
    ["studentsArray", ["Id", "Name", "Surname", "City", "OfficialEmail", "Birthday", "SSN"]],
    ["coursesArray", ["Code", "Year", "Semester", "Course", "Teacher"]],
    ["professorsArray", ["Number", "GivenName", "Surname", "OfficialEmail", "SSN"]],
    ["schedulesArray", ["Code", "Room", "Day", "Seats", "Time"]],
    ["enrollmentsArray", ["Code", "Student"]],
]);


class SupportPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { show: null, success: false, refresh: false, genError: null, loading: false };
    }

    /**
     * Sets the states 'name' to the value 'data'
     * @param {*} data 
     * @param {*} name 
     */
    handleOnDrop = (data, name, filename) => {
        let type = filename.type;
        let match = filename.name.match(/.+(\.csv)$/);
        let valid = true;
        for (let d of data)
            if (d.errors.length)
                valid = false;

        if (!valid) {
            this.setState({ genError: filename.name + " has an invalid row. Please check it again.", [name]: null, [name + "File"]: null });
        }
        else {
            if (type === "text/csv" || type === ".csv" || type === "application/vnd.ms-excel" || match) {
                if (JSON.stringify(Object.getOwnPropertyNames(data[0].data)) !== JSON.stringify(fileProps.get(name)))
                    this.setState({ genError: filename.name + " is not in an expected format.", [name]: null, [name + "File"]: null });
                else
                    this.setState({ [name]: data.length, [name + "File"]: filename });
            } else
                this.setState({ genError: filename.name + " is not a valid file (expected type: csv).", [name]: null, [name + "File"]: null });
        }
    }

    /**
     * CSVReader component error handler
     * @param {*} err 
     * @param {*} file 
     * @param {*} inputElem 
     * @param {*} reason 
     */
    handleOnError = (err, file, inputElem, reason) => {
        console.log(err);
    }

    /**
     * Clears the state corresponding to 'name' param
     * @param {*} data 
     * @param {*} name 
     */
    handleOnRemoveFile = (data, name) => {
        if (!this.state.loading)
            this.setState({ [name]: null, [name + "File"]: null })
    }

    /**
     * Calculates the length of each loaded array, then opens the SummaryModal component
     */
    showModal = () => {
        let students = this.state.studentsArray ? "students: " + this.state.studentsArray : "";
        let courses = this.state.coursesArray ? "courses: " + this.state.coursesArray : "";
        let professors = this.state.professorsArray ? "professors: " + this.state.professorsArray : "";
        let schedules = this.state.schedulesArray ? "schedules: " + this.state.schedulesArray : "";
        let enrollments = this.state.enrollmentsArray ? "enrollments: " + this.state.enrollmentsArray : "";
        let elems = students || courses || professors || schedules || enrollments ? [students, courses, professors, schedules, enrollments] : [];
        this.setState({ show: true, elems: elems });
    }

    /**
     * Closes the SummaryModal component
     */
    closeModal = () => {
        this.setState({ show: false, elems: null });
    }

    /**
     * Manages the API calls for each of the type of entry loaded
     */
    sendFiles = async () => {
        this.setState({ show: false, loading: true });
        try {
            if (this.state.studentsArrayFile)
                await API.uploadList(this.props.user.userId, "students", this.state.studentsArrayFile);
            if (this.state.professorsArrayFile)
                await API.uploadList(this.props.user.userId, "teachers", this.state.professorsArrayFile);
            if (this.state.coursesArrayFile)
                await API.uploadList(this.props.user.userId, "courses", this.state.coursesArrayFile);
            if (this.state.schedulesArrayFile)
                await API.uploadList(this.props.user.userId, "schedules", this.state.schedulesArrayFile);
            if (this.state.enrollmentsArrayFile)
                await API.uploadList(this.props.user.userId, "enrollments", this.state.enrollmentsArrayFile);
            this.setState({ elems: null, success: true, loading: false }); //ok
        } catch (err) {
            let errormsg = err.error;
            this.setState({ elems: null, genError: errormsg, loading: false });
        }
    }

    /**
    * Sets the state refresh to 'true', forcing the page to refresh (in the render function) 
    */
    refreshPage = () => {
        this.setState({ refresh: true });
    }

    closeError = () => {
        this.setState({ genError: null });
    }
    /**
     * Renders the SupportPage component
     */
    render() {
        if (this.state.refresh)
            return <Redirect to="/" />; //since the user props is still available, the user will be redirected back to this page
        else
            return <>
                { this.state.show &&
                    <SummaryModal sumClose={this.closeModal} send={this.sendFiles} elems={this.state.elems} />}
                { (this.state.success || this.state.genError) &&
                    <GenericModal successClose={this.refreshPage} errorClose={this.closeError} success={this.state.success} error={this.state.genError} />}
                <Container fluid id="supportContainer">
                    <Row className="justify-content-md-center">
                        <Col sm={6}>
                            <Card>
                                <Card.Body>
                                    <Card.Text>Hi <b>{this.props.user.firstName}</b>, welcome to setup page. If you want to add a certain type of data, click on corresponding <i>header</i>.
                                Once you have done, click on the <i>button</i> below.<br /><br />You should consider the following restrains in case you are not uploading all file together:<br />
                                        <ul><li>teachers present in the courses file should be already loaded in the system;</li>
                                            <li>students and courses present in the enrollments file should be already loaded in the system;</li>
                                            <li>in general, you shouldn't upload the same file more than once.</li></ul></Card.Text>
                                </Card.Body>
                            </Card>
                            <br />
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col sm={6}>
                            <Accordion>
                                <Card>
                                    <Accordion.Toggle as={Card.Header} eventKey="0">
                                        <GoChevronDown size={16} /> <b>STUDENTS</b> {this.state.studentsArray ? <GoCheck size={16} /> : ""}
                                    </Accordion.Toggle>
                                    <Accordion.Collapse eventKey="0">
                                        <Card.Body>
                                            <CSVPanel handleOnDrop={this.handleOnDrop} handleOnError={this.handleOnError} handleOnRemoveFile={this.handleOnRemoveFile} stateName="studentsArray" elem="students" />
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                                <Card>
                                    <Accordion.Toggle as={Card.Header} eventKey="1">
                                        <GoChevronDown size={16} /> <b>COURSES</b> {this.state.coursesArray ? <GoCheck size={16} /> : ""}
                                    </Accordion.Toggle>
                                    <Accordion.Collapse eventKey="1">
                                        <Card.Body>
                                            <CSVPanel handleOnDrop={this.handleOnDrop} handleOnError={this.handleOnError} handleOnRemoveFile={this.handleOnRemoveFile} stateName="coursesArray" elem="courses" />
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                                <Card>
                                    <Accordion.Toggle as={Card.Header} eventKey="2">
                                        <GoChevronDown size={16} /> <b>PROFESSORS</b> {this.state.professorsArray ? <GoCheck size={16} /> : ""}
                                    </Accordion.Toggle>
                                    <Accordion.Collapse eventKey="2">
                                        <Card.Body>
                                            <CSVPanel handleOnDrop={this.handleOnDrop} handleOnError={this.handleOnError} handleOnRemoveFile={this.handleOnRemoveFile} stateName="professorsArray" elem="professors" />
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                                <Card>
                                    <Accordion.Toggle as={Card.Header} eventKey="3">
                                        <GoChevronDown size={16} /> <b>SCHEDULES</b> {this.state.schedulesArray ? <GoCheck size={16} /> : ""}
                                    </Accordion.Toggle>
                                    <Accordion.Collapse eventKey="3">
                                        <Card.Body>
                                            <CSVPanel handleOnDrop={this.handleOnDrop} handleOnError={this.handleOnError} handleOnRemoveFile={this.handleOnRemoveFile} stateName="schedulesArray" elem="schedules" />
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                                <Card>
                                    <Accordion.Toggle as={Card.Header} eventKey="4">
                                        <GoChevronDown size={16} /> <b>ENROLLMENTS</b> {this.state.enrollmentsArray ? <GoCheck size={16} /> : ""}
                                    </Accordion.Toggle>
                                    <Accordion.Collapse eventKey="4">
                                        <Card.Body>
                                            <CSVPanel handleOnDrop={this.handleOnDrop} handleOnError={this.handleOnError} handleOnRemoveFile={this.handleOnRemoveFile} stateName="enrollmentsArray" elem="enrollments" />
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                            </Accordion>
                            <br />
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Button variant="warning" size="m" data-testid="submit-button" onClick={this.showModal} disabled={this.state.loading}>Submit your data</Button>
                    </Row>
                    <Row className="justify-content-md-center">
                        {this.state.loading && <label><br />Uploading data...&emsp;&emsp;<Spinner animation="border" /></label>}
                    </Row>
                </Container>
            </>;
    }

}

/**
 * Returns the component to let csv files to be loaded and converted in JSON arrays
 * @param {*} props 
 */
function CSVPanel(props) {
    const options = {
        header: true,
    };
    return <CSVReader
        config={options}
        onDrop={(data, name) => props.handleOnDrop(data, props.stateName, name)}
        onError={props.handleOnError}
        addRemoveButton
        onRemoveFile={(data) => props.handleOnRemoveFile(data, props.stateName)}
    >
        <span>Click or drop to upload.</span>
    </CSVReader>;
}

/**
 * Returns the Modal component to summarize all data that will be uploaded
 * @param {*} props 
 */
function SummaryModal(props) {
    return <Modal show={true} onHide={props.sumClose}>
        <Modal.Header closeButton>
            <Modal.Title>Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {props.elems.length === 0 && <>No file uploaded yet.</>}
            {props.elems.length !== 0 && <>Your entries:<br />
                <ul>
                    {props.elems.map((e) => {
                        if (e)
                            return <li key={e}><b>{e}</b></li>;
                    })}
                </ul><br />
                Do you want to upload them?</>}
        </Modal.Body>
        <Modal.Footer>
            {props.elems.length === 0 && <Button name="close" data-testid="sum-close" variant="secondary" onClick={props.sumClose}>Close</Button>}
            {props.elems.length !== 0 && <><Button name="yes" data-testid="sum-yes" variant="secondary" onClick={props.send}>Yes</Button><Button name="no" data-testid="sum-no" variant="secondary" onClick={props.sumClose}>No</Button></>}
        </Modal.Footer>
    </Modal>;
}

/**
 * Returns the Modal component to notify the user of the opersation success
 * @param {*} props 
 */
function GenericModal(props) {
    return <Modal show={true} onHide={props.success ? props.successClose : props.errorClose}>
        <Modal.Header closeButton>
            <Modal.Title>{props.success ? <>Done</> : <>Error</>}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {props.success ? <>Operation successful!</> : <label data-testid="text-error">{props.error}</label>}
        </Modal.Body>
        <Modal.Footer>
            <Button name="close" data-testid="success-close" variant="secondary" onClick={props.success ? props.successClose : props.errorClose}>Close</Button>
        </Modal.Footer>
    </Modal>;
}


export default SupportPage;