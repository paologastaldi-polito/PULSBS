import React from 'react';
import Container from "react-bootstrap/Container";
import API from "../api/Api";
import Calendar from '../components/Calendar';
import CalendarEvent from "../entities/calendarEvent";
import ErrorMsg from '../components/ErrorMsg';
import moment from "moment";
import Spinner from 'react-bootstrap/Spinner';
import APIfake from '../api/APIfake';
/**
 * Student Page component
 */
class StudentPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { user: props.user, loading: true };
    }
    /**
     * At the creation of the page this component fetches all the courses, all the lectures and all the booking lectures
     */
    async componentDidMount() {
        try {
            const courses = await API.getCoursesByStudentId(this.state.user.userId);
            const bookedOrWaitingLectures = await API.getBookedLectures(this.state.user.userId);
            const bookedLectures = bookedOrWaitingLectures.booked;
            const waitedLectures = bookedOrWaitingLectures.waited;
            const allLectures = await this.getAllLectures(courses);
            const events = buildEvents(bookedLectures, waitedLectures, allLectures, courses); //build the events for the calendar
            this.setState({ courses: courses, events: events, loading: false });
        } catch (err) {
            this.setState({ fetchError: err, loading: false })
        }
    }
    /**
     * Fetch all lectures of all courses
     * @param {Course} courses 
     */
    async getAllLectures(courses) {
        try {
            let lectures = []
            for (let c of courses)
                lectures.push(await API.getLecturesByCourseId(this.state.user.userId, c.courseId))
            return lectures;
        } catch (err) {
            throw err;
        }

    }
    /**
     * This function performs a booking (or booking cancellation) calling APIs
     * @param {String} status 
     * @param {Int} courseId 
     * @param {Int} lectureId 
     * @returns {Promise}
     */
    handleConfirm = async (status, courseId, lectureId) => {
        return new Promise((resolve, reject) => {
            if (status === "booked") {
                API.cancelLectureReservation(this.state.user.userId, courseId, lectureId)
                    .then(async (availableSeats) => {
                        let changedEvent;
                        if (availableSeats <= 0)
                            changedEvent = await this.changeEvent(lectureId, "orange", "full")
                        else if (isExpired(lectureId, this.state.events))
                            changedEvent = await this.changeEvent(lectureId, "red", "expired")
                        else changedEvent = await this.changeEvent(lectureId, "green", "bookable")
                        resolve(changedEvent)
                    })
                    .catch(() => reject())
            }
            if (status === "bookable") {
                API.bookALecture(this.state.user.userId, courseId, lectureId)
                    .then(async () => {
                        let changedEvent = await this.changeEvent(lectureId, "blue", "booked")
                        resolve(changedEvent)
                    })
                    .catch(() => reject())
            }
            if (status === "full") {
                API.putInWaitingList(this.state.userId, courseId, lectureId)
                    .then(async () => {
                        let changedEvent = await this.changeEvent(lectureId, "orange", "inWaitingList")
                        resolve(changedEvent)
                    })
                    .catch(() => reject())
            }
        })

    }

    /**
     * Change an event into calendar events
     * @param {Int} lectureId 
     * @param {String} color 
     * @param {String} status 
     */
    changeEvent = async (lectureId, color, status) => {
        return new Promise((resolve, reject) => {
            const events = this.state.events;
            for (let i = 0; i < events.length; i++)
                if (events[i].lectureId === lectureId) {
                    if (status === "bookable")
                        events[i].availableSeats++;
                    events[i].color = color;
                    events[i].status = status;
                    this.setState({ events: events })
                    resolve(events[i]);
                }
        });
    }

    /**
     * Render the StudentPage component
     */
    render() {
        if (this.state.fetchError)
            return <ErrorMsg msg={this.state.fetchError} onClose={() => { }} />
        if (this.state.loading)
            return <Spinner animation="border" />
        return (
            <>
                <Container fluid>

                    <Calendar lessons={this.state.events} handleConfirm={this.handleConfirm} />

                </Container>
            </>);
    }
}
/**
 * Build the whole collection of calendar events startinf from all and booked lectures of the user
 * @param {Array of Lectures} booked all booked lectures
 * @param {Array of Lectures} all all lectures
 * @param {Array of Courses} courses all courses
 */
function buildEvents(booked, waited, all, courses) {
    const events = []
    for (let array of all)
        for (let lecture of array) {
            let availableSeats = lecture.classCapacity - lecture.numBookings;
            if (moment(lecture.startingDate).isBefore(moment()))
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "black", "past", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm")))
            else if (isWaited(lecture, waited))
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "orange", "inWaitingList", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm"), availableSeats, lecture.className))
            else if (lecture.delivery === "REMOTE")
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "grey", "remote", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm")))
            else if (isBooked(lecture, booked))
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "blue", "booked", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm"), availableSeats, lecture.className))
            else if (moment(lecture.bookingDeadline).isBefore(moment()))
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "red", "expired", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm"), null, lecture.className))
            else if (availableSeats <= 0)
                events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "orange", "full", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm"), availableSeats, lecture.className))
            else events.push(new CalendarEvent(events.length, courseName(courses, lecture.courseId), moment(lecture.startingDate).toISOString(), moment(lecture.startingDate).add(lecture.duration, "milliseconds").toISOString(), "green", "bookable", lecture.lectureId, lecture.courseId, moment(lecture.bookingDeadline).format("DD-MM-YYYY HH:mm"), availableSeats, lecture.className))
        }
    return events;
}

function isWaited(lecture, waited) {
    for (let l of waited)
        if (l.lectureId === lecture.lectureId)
            return true
    return false
}
/**
 * Check if a lecture is booked
 * @param {Lecture} lecture 
 * @param {Array of Lectures} booked 
 */
function isBooked(lecture, booked) {
    for (let l of booked)
        if (l.lectureId === lecture.lectureId)
            return true
    return false
}
/**
 * Return the name of the course from the id
 * @param {Array of Courses} courses 
 * @param {Int} courseId 
 */
function courseName(courses, courseId) {
    for (let c of courses)
        if (c.courseId === courseId)
            return c.description;
}
/**
 * Return true if the lesson is expired
 * @param {*} id 
 * @param {*} events 
 */
function isExpired(id, events) {
    for (let event of events)
        if (event.lectureId == id)
            if (moment(event.bookingDeadline).isBefore(moment()))
                return true
    return false
}
export default StudentPage