import React from 'react';
import Container from "react-bootstrap/Container";
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const Checkbox = ({ name, checked = false, onChange, type }) => (
    <Form.Check name={name} checked={checked} onChange={onChange} data-testid={type + "-" + name} />
);

class CoursePanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = { currentPage: 0 };
    }

    //triggers the selected lecture (or untrigger if already)
    handler = (e) => {
        if (this.props.sCourse === e.target.name)
            this.props.reset("course");
        else
            this.props.update(e.target.name);
    }

    //NavButtons handler
    onClick = (e) => {
        if (e.target.name === "prev")
            this.setState({ currentPage: this.state.currentPage - 1 });
        else //next
            this.setState({ currentPage: this.state.currentPage + 1 });
    }

    render() {
        return <>
            <Container fluid>
                <strong>Course list:</strong><br />
                <Table striped hover>
                    <thead>
                        <tr>
                            <th>Course Id</th>
                            <th>Name</th>
                            <th>Choose a course</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.courses.map((course) => (
                                <CoursePanelRow key={course.courseId} checkedOne={this.props.sCourse} course={course} handler={this.handler} pMap={this.props.pageMap}
                                    nPages={this.props.nPages} current={this.state.currentPage} />
                            ))
                        }
                        <tr style={{ backgroundColor: "white" }}>
                            <td>
                                {this.props.nPages > 1 && <NavButtons currentPage={this.state.currentPage} nPages={this.props.nPages} onClick={this.onClick} />}
                                {this.props.courses.length === 0 && <label>no courses available.</label>}
                            </td>
                            <td></td>
                            <td>{this.props.sCourse && <label>Selected course: {this.props.sCourse}</label>}</td>
                        </tr>
                    </tbody>
                </Table><br />
            </Container>
        </>;
    }
}

function CoursePanelRow(props) {
    if (props.nPages === 1 || (props.nPages > 1 && props.pMap.get(props.course.courseId) === props.current))
        return <tr data-testid="course-row">
            <td>{props.course.courseId}</td>
            <td>{props.course.description}</td>
            <td><Checkbox name={props.course.courseId} checked={props.checkedOne == props.course.courseId ? true : false} onChange={props.handler} type={"c"} /></td>
        </tr>
    return <></>;
}

class LecturePanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = { currentPage: 0 };
    }

    //triggers the selected lecture (or untrigger if already)
    handler = (e) => {
        if (this.props.sLecture === e.target.name)
            this.props.reset("lecture");
        else
            this.props.update(e.target.name);
    }

    //triggers EditModal
    editOpen = (e) => {
        this.props.showEditModal(e.target.name, e.target.value);
    }

    //triggers DeleteModal
    deleteOpen = (e) => {
        this.props.showDeleteModal(e.target.name);
    }

    //NavButtons handler
    onClick = (e) => {
        if (e.target.name == "prev")
            this.setState({ currentPage: this.state.currentPage - 1 });
        else //next
            this.setState({ currentPage: this.state.currentPage + 1 });
    }

    render() {
        return <>
            <Container fluid>
                <strong>Lecture list:</strong><br />
                <Table striped hover>
                    <thead>
                        <tr>
                            <th>Lecture Id</th>
                            <th>Date</th>
                            <th>Delivery</th>
                            <th>Modify</th>
                            <th>Delete</th>
                            <th>Choose a lecture</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.lectures.map((lecture) => (<LecturePanelRow key={lecture.lectureId} checkedOne={this.props.sLecture} lecture={lecture} handler={this.handler}
                                pMap={this.props.pageMap} nPages={this.props.nPages} current={this.state.currentPage} editOpen={this.editOpen} deleteOpen={this.deleteOpen} />))
                        }
                        <tr style={{ backgroundColor: "white" }}>
                            <td>
                                {this.props.nPages > 1 && <NavButtons currentPage={this.state.currentPage} nPages={this.props.nPages} onClick={this.onClick} />}
                                {this.props.lectures.length === 0 && <label>no lectures available.</label>}
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>{this.props.sLecture && <label>Selected lecture: {this.props.sLecture}</label>}</td>
                        </tr>
                    </tbody>
                </Table><br />
            </Container>
        </>;
    }
}

function LecturePanelRow(props) {
    let date = new Date(props.lecture.startingDate);
    let now = new Date();
    let canEdit = ((date.getTime() - now.getTime()) / (1000 * 60)) > 30 ? true : false; //check to time distance (more than 30 minutes)
    let canDelete = ((date.getTime() - now.getTime()) / (1000 * 60)) > 60 ? true : false; //check to time distance (more than 60 minutes)
    if (props.nPages === 1 || (props.nPages > 1 && props.pMap.get(props.lecture.lectureId) === props.current))
        return <tr data-testid="lecture-row">
            <td>{props.lecture.lectureId}</td>
            <td>{date.toLocaleDateString()}{" " + (date.toLocaleTimeString()).slice(0, 5)}</td>
            <td>{props.lecture.delivery}</td>
            <td>{!canEdit && props.lecture.delivery !== 'REMOTE' &&
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Can't switch delivery if the lecture is closer than 30 mins.</Tooltip>}>
                    <span className="d-inline-block">
                        <Button disabled style={{ pointerEvents: 'none' }} variant="warning">modify</Button>
                    </span></OverlayTrigger>}
                {props.lecture.delivery === 'REMOTE' &&
                    <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Can't switch delivery to Presence.</Tooltip>}>
                        <span className="d-inline-block">
                            <Button disabled style={{ pointerEvents: 'none' }} variant="warning">modify</Button>
                        </span></OverlayTrigger>}
                {canEdit && props.lecture.delivery !== 'REMOTE' &&
                    <Button name={props.lecture.lectureId} value={props.lecture.delivery} onClick={props.editOpen}
                        variant="warning" data-testid={"m-" + props.lecture.lectureId} disabled={props.lecture.delivery === 'ERROR' ? true : false}>modify</Button>}
            </td>
            <td>{!canDelete &&
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Can't delete lecture if the lecture is closer than 60 mins.</Tooltip>}>
                    <span className="d-inline-block">
                        <Button disabled style={{ pointerEvents: 'none' }} variant="warning">delete</Button>
                    </span></OverlayTrigger>}
                {canDelete && <Button name={props.lecture.lectureId} onClick={props.deleteOpen} data-testid={"d-" + props.lecture.lectureId} variant="warning">delete</Button>}
            </td>
            <td><Checkbox name={props.lecture.lectureId} checked={props.checkedOne == props.lecture.lectureId ? true : false} onChange={props.handler} type={"l"} /></td>
        </tr>
    return <></>;
}

class StudentPanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = { currentPage: 0 };
    }

    //NavButtons handler
    onClick = (e) => {
        if (e.target.name == "prev")
            this.setState({ currentPage: this.state.currentPage - 1 });
        else //next
            this.setState({ currentPage: this.state.currentPage + 1 });
    }

    render() {
        return <>
            <Container fluid>
                <strong>Student list:</strong><br />
                <Table striped hover>
                    <thead>
                        <tr>
                            <th>Last Name</th>
                            <th>First Name</th>
                            <th>Student Id</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.students.map((student) => (<StudentPanelRow key={student.studentId} student={student} pMap={this.props.pageMap}
                                nPages={this.props.nPages} current={this.state.currentPage} />))
                        }
                        <tr style={{ backgroundColor: "white" }}>
                            <td>
                                {this.props.nPages > 1 && <NavButtons currentPage={this.state.currentPage} nPages={this.props.nPages} onClick={this.onClick} />}
                                {this.props.students.length === 0 && <label>no students listed.</label>}
                            </td>
                            <td></td>
                            <td>{this.props.students.length !== 0 && <label>Number of students: {this.props.students.length}</label>}</td>
                        </tr>
                    </tbody>
                </Table><br />
            </Container>
        </>;
    }
}

function StudentPanelRow(props) {
    if (props.nPages === 1 || (props.nPages > 1 && props.pMap.get(props.student.studentId) === props.current))
        return <tr data-testid="student-row">
            <td>{props.student.lastName}</td>
            <td>{props.student.firstName}</td>
            <td>{props.student.studentId}</td>
        </tr>
    return <></>;
}

function NavButtons(props) {
    return <>
        <Button name="prev" size="sm" disabled={props.currentPage === 0 ? true : false} onClick={props.onClick} variant="warning">Previous</Button>
        &nbsp;<label>{props.currentPage + 1} / {props.nPages}</label>&nbsp;
        <Button name="next" size="sm" disabled={props.currentPage === props.nPages - 1 ? true : false} onClick={props.onClick} variant="warning">Next</Button>
    </>;
}

function EditModal(props) {
    return <>
        <Modal show={true} onHide={props.editClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Delivery</Modal.Title>
            </Modal.Header>
            <Modal.Body>Do you want to turn lecture <b>{props.lectureId}</b> from <b>{props.delivery}</b> to <b>{props.delivery == 'PRESENCE' ? 'REMOTE' : 'PRESENCE'}</b>?</Modal.Body>
            <Modal.Footer>
                <Button name="yes" data-testid={"yes-m-" + props.lectureId} variant="secondary" onClick={props.updateDelivery}>Yes</Button><Button name="no" data-testid={"no-m-" + props.lectureId} variant="secondary" onClick={props.editClose}>No</Button>
            </Modal.Footer>
        </Modal>
    </>;
}

function DeleteModal(props) {
    return <>
        <Modal show={true} onHide={props.deleteClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Delivery</Modal.Title>
            </Modal.Header>
            <Modal.Body>Do you want to cancel lecture <b>{props.lectureId}</b> ?</Modal.Body>
            <Modal.Footer>
                <Button name="yes" data-testid={"yes-d-" + props.lectureId} variant="secondary" onClick={props.deleteLecture}>Yes</Button><Button name="no" data-testid={"no-d-" + props.lectureId} variant="secondary" onClick={props.deleteClose}>No</Button>
            </Modal.Footer>
        </Modal>
    </>;
}

export { CoursePanel, LecturePanel, StudentPanel, EditModal, DeleteModal };



