import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import API from '../api/Api';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';
import moment from 'moment';
import Helmet from 'react-helmet';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { formatDate, parseDate } from 'react-day-picker/moment';
import ErrorMsg from '../components/ErrorMsg';

class SupportUpdatePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loadingPage: true, chosenCourse: "All", from: undefined, to: undefined }
    }

    async componentDidMount() {
        try {
            let courses = await API.getCoursesBySupportId(this.props.user.userId)
            let lectures = []
            for (let course of courses)
                lectures.push(...await API.getLecturesByCourseId_S(this.props.user.userId, course.courseId))
            lectures = lectures.filter((lecture) => { return moment(lecture.startingDate).isAfter(moment()) })
            this.setState({ courses: courses, loadingPage: false, lectures: lectures })
        } catch (err) {
            this.setState({ communicationError: true, loadingPage: false })
        }
    }
    /**
     * Change chosen course in the page state
     * @param {Course} course 
     */
    changeCourse = (course) => {
        this.setState({ chosenCourse: course })
    }

    /**
     * Change from in the page state
     * @param {Date} from 
     */
    changeFrom = (from) => {
        this.setState({ from: from })
    }

    /**
     * Change to in the page state
     * @param {Date} to 
     */
    changeTo = (to) => {
        this.setState({ to: to })
    }

    /**
     * Change delivery of selected lecture
     * @param {Lecture} lecture 
     */
    changeDelivery = (lecture) => {
        this.setState({ loading: true })
        API.updateDeliveryByLecture_S(this.props.user.userId, lecture.courseId, lecture.lectureId, lecture.delivery === "REMOTE" ? "PRESENCE" : "REMOTE")
            .then(() => {
                let lectures = this.state.lectures;
                for (let l of lectures)
                    if (l.lectureId === lecture.lectureId)
                        l.delivery = lecture.delivery === "REMOTE" ? "PRESENCE" : "REMOTE"
                this.setState({ loading: false, lectures: lectures })

            })
            .catch(() => {
                this.setState({ communicationError: true, loading: false })
            })
    }
    /**
     * Remove lecture
     * @param {Lecture} lecture
     */
    deleteLecture = (lecture) => {
        this.setState({ loading: true })
        API.deleteLecture_S(this.props.user.userId, lecture.courseId, lecture.lectureId)
            .then(() => {
                let lectures = this.state.lectures;

                for (let i = 0; i < lectures.length; i++)
                    if (lectures[i].lectureId == lecture.lectureId)
                        lectures.splice(i, 1)

                this.setState({ loading: false, lectures: lectures })
            })
            .catch(() => {
                this.setState({ communicationError: true, loading: false })
            })
    }


    render() {
        if (this.state.communicationError)
            return <ErrorMsg msg="Ops, an error occured during server communication" onClose={() => { }} />

        if (this.state.loadingPage)
            return (<Spinner animation="border" ></Spinner>)

        return (
            <>
                <Container fluid id="containerFilters">
                    <Filters courses={this.state.courses} chosenCourse={this.state.chosenCourse} changeCourse={this.changeCourse}
                        from={this.state.from} to={this.state.to} changeFrom={this.changeFrom} changeTo={this.changeTo} />
                </Container>
                <Lectures lectures={this.state.lectures} from={this.state.from} to={this.state.to} chosenCourse={this.state.chosenCourse} courses={this.state.courses}
                    changeDelivery={this.changeDelivery} deleteLecture={this.deleteLecture} />
            </>
        )
    }
}

function Filters(props) {
    return (
        <Container fluid>
            <Form>
                <Row>
                    <Col>
                        <strong>Select a course : </strong>
                    </Col>
                    <Col>
                        <strong>Select temporal interval :</strong>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Control as="select" data-testid="courseSelect" custom onChange={(ev) => { props.changeCourse(ev.target.value) }} >
                            <option key="All" value="All" data-testid="All" >All</option>
                            {props.courses.map((course) => { return (<option key={course.courseId} data-testid={course.description} value={course.description} >{course.description}</option>) })}
                        </Form.Control>
                    </Col>
                    <Col>
                        <FromToDayPicker from={props.from} to={props.to} changeFrom={props.changeFrom} changeTo={props.changeTo} />
                    </Col>
                </Row>
            </Form>
        </Container>
    )
}
class FromToDayPicker extends React.Component {
    constructor(props) {
        super(props);
        this.handleFromChange = this.handleFromChange.bind(this);
        this.handleToChange = this.handleToChange.bind(this);
    }

    showFromMonth() {
        const { from, to } = this.props;
        if (!from) {
            return;
        }
        if (moment(to).diff(moment(from), 'months') < 2) {
            this.to.getDayPicker().showMonth(from);
        }
    }

    handleFromChange(from) {
        this.props.changeFrom(from)
    }

    handleToChange(to) {
        this.props.changeTo(to)
    }

    render() {
        const { from, to } = this.props;
        const modifiers = { start: from, end: to };
        return (
            <div className="InputFromTo">
                <DayPickerInput
                    value={from}
                    placeholder="From"
                    format="LL"
                    formatDate={formatDate}
                    parseDate={parseDate}
                    dayPickerProps={{
                        selectedDays: [from, { from, to }],
                        disabledDays: { after: to },
                        toMonth: to,
                        modifiers,
                        numberOfMonths: 2,
                        onDayClick: () => this.to.getInput().focus(),
                    }}
                    onDayChange={this.handleFromChange}
                />{' '}—{' '}
                <span className="InputFromTo-to">
                    <DayPickerInput
                        ref={el => (this.to = el)}
                        value={to}
                        placeholder="To"
                        format="LL"
                        formatDate={formatDate}
                        parseDate={parseDate}
                        dayPickerProps={{
                            selectedDays: [from, { from, to }],
                            disabledDays: { before: from },
                            modifiers,
                            month: from,
                            fromMonth: from,
                            numberOfMonths: 2,
                        }}
                        onDayChange={this.handleToChange}
                    />
                </span>
                <Helmet>
                    <style>{`
                            .InputFromTo .DayPicker-Day--selected:not(.DayPicker-Day--start):not(.DayPicker-Day--end):not(.DayPicker-Day--outside) {
                            background-color: #f0f8ff !important;
                            color: #4a90e2;
                            }
                            .InputFromTo .DayPicker-Day {
                            border-radius: 0 !important;
                            }
                            .InputFromTo .DayPicker-Day--start {
                            border-top-left-radius: 50% !important;
                            border-bottom-left-radius: 50% !important;
                            }
                            .InputFromTo .DayPicker-Day--end {
                            border-top-right-radius: 50% !important;
                            border-bottom-right-radius: 50% !important;
                            }
                            .InputFromTo .DayPickerInput-Overlay {
                            width: 550px;
                            }
                            .InputFromTo-to .DayPickerInput-Overlay {
                            margin-left: -198px;
                            }
                    `}</style>
                </Helmet>
            </div>
        );
    }
}
function Lectures(props) {

    const [active, setActive] = useState(1);
    let lectures = filterLectures(props.lectures, props.from, props.to, props.chosenCourse, props.courses, props.changeDelivery, props.deleteLecture)
    if (lectures.length === 0)
        return <Alert variant="warning">No lectures</Alert>
    let nPages = Math.floor(lectures.length / 11) + 1;
    let items = [];
    for (let number = 1; number <= nPages; number++) {
        items.push(
            <Pagination.Item data-testid={"paginationItem-" + number} className="paginationItemReport" key={number} active={number == active} >
                {number}
            </Pagination.Item>,
        );
    }
    let tableEntries = [];
    for (let entry = (active - 1) * 10; entry <= active * 10 - 1; entry++) {
        if (lectures[entry])
            tableEntries.push(lectures[entry])
    }
    return (
        <>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Class</th>
                        <th>Date</th>
                        <th>Start Hour</th>
                        <th>End Hour</th>
                        <th>Booking deadline</th>
                        <th>Delivery</th>
                        <th>Change delivery</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {tableEntries}
                </tbody>
            </Table>
            {nPages > 1 && <Pagination onClick={(ev) => { if (ev.target.text) setActive(ev.target.text) }}>{items}</Pagination>}
        </>
    )
}

function filterLectures(lectures, from, to, chosenCourse, courses, changeDelivery, deleteLecture) {
    let filterLectures = lectures
    if (chosenCourse !== "All")
        filterLectures = filterLectures.filter((lecture) => courseName(lecture.courseId, courses) === chosenCourse)
    if (from)
        filterLectures = filterLectures.filter((lecture) => moment(lecture.startingDate).isAfter(from))
    if (to)
        filterLectures = filterLectures.filter((lecture) => moment(lecture.startingDate).isBefore(to))
    let entries = []
    for (let lecture of filterLectures) {
        entries.push(<TableEntry lecture={lecture} courses={courses} changeDelivery={changeDelivery} deleteLecture={deleteLecture} />)
    }
    return entries
}

const trash = <svg className="bi bi-trash" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
</svg>
function TableEntry(props) {
    return (
        <tr key={props.lecture.lectureId} data-testid={props.lecture.courseId}>
            <td>{courseName(props.lecture.courseId, props.courses)}</td>
            <td>{props.lecture.classId}</td>
            <td>{moment(props.lecture.startingDate).format("DD-MM-YYYY")}</td>
            <td>{moment(props.lecture.startingDate).format("HH:mm")}</td>
            <td>{moment(props.lecture.startingDate).add(props.lecture.duration, "milliseconds").format("HH:mm")}</td>
            <td>{moment(props.lecture.bookingDeadline).format("DD-MM-YYYY HH:mm")}</td>
            <td>{props.lecture.delivery === "REMOTE" ? "REMOTE" : "IN PRESENCE"}</td>
            <td>{props.lecture.delivery === "REMOTE" ?
                <Button data-testid={props.lecture.lectureId + "-button"} variant="warning" onClick={() => props.changeDelivery(props.lecture)} >Change to "In Presence"</Button>
                :
                <Button data-testid={props.lecture.lectureId + "-button"} variant="warning" onClick={() => props.changeDelivery(props.lecture)}>Change to "Remote"&emsp;&emsp;</Button>}
            </td>
            <td><Button variant="danger" onClick={() => props.deleteLecture(props.lecture)}>{trash}</Button></td>
        </tr >
    )
}
function courseName(id, courses) {
    for (let course of courses)
        if (course.courseId === id)
            return course.description
}
export default SupportUpdatePage