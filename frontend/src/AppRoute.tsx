import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import MainLayout from '@components/Layout/MainLayout';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ActivationPage from './pages/Auth/ActivationPage.tsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage.tsx';
import ProtectedRoute from './components/Login/ProtectedRoute';
import {useAuthStore} from '@store/useAuthStore';

import MySchedule from './pages/MySchedule/MySchedule.tsx';

import ChooseScheduleTypePage from "./pages/Schedules/ChooseScheduleTypePage.tsx";
import FacilitiesPage from "./pages/Facilities/FacilitiesPage.tsx";
import EmployeesSchedulesPage from './pages/Schedules/EmployeesSchedulesPage.tsx'
import EmployeeSchedulePage from './pages/Schedules/EmployeeSchedulePage.tsx'
import StructuresPage from "./pages/Structures/StructuresPage.tsx";
import StudentsPage from "./pages/Students/StudentsPage.tsx";
import EmployeesPage from "./pages/Employees/EmployeesPage.tsx";
import UsersPage from "./pages/Users/UsersPage.tsx";
import RolesPage from "./pages/Roles/RolesPage.tsx";
import SchedulesFacilitiesPage from "./pages/Schedules/FacilitiesSchedulesPage.tsx";
import RoomSchedulePage from "./pages/Schedules/RoomSchedulePage.tsx";
import StudentSchedulePage from "./pages/Schedules/StudentSchedulePage.tsx";
import StudentsSchedulesPage from "./pages/Schedules/StudentsSchedulesPage.tsx";
import DidacticsPage from "./pages/Didactics/DidacticsPage.tsx";

function AppRoute() {
    const isAuthenticated = useAuthStore((state) => state.token !== null);

    return (
        <BrowserRouter>
            <Routes>
                {/*==================== AUTHENTICATION ====================*/}
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/activate" element={<ActivationPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>

                {/*==================== PROTECTED ====================*/}
                <Route element={<ProtectedRoute/>}>
                    <Route element={<MainLayout/>}>
                        {/*==================== MY PLAN ====================*/}
                        <Route path="/plan" element={<MySchedule/>}/>

                        {/*==================== EDIT FACILITIES ====================*/}
                        <Route path="/facilities" element={<FacilitiesPage view="campuses"/>}/>
                        <Route path="/facilities/campus/:campusId" element={<FacilitiesPage view="buildings"/>}/>
                        <Route path="/facilities/campus/:campusId/building/:buildingId"
                               element={<FacilitiesPage view="rooms"/>}/>

                        {/*==================== EDIT STRUCTURES ====================*/}
                        <Route path="/structures" element={<StructuresPage view="faculties"/>}/>
                        <Route path="/structures/faculty/:facultyId" element={<StructuresPage view="units"/>}/>

                        {/*==================== EDIT USERS ====================*/}
                        <Route path="/users" element={<UsersPage/>}/>

                        {/*==================== EDIT ROLES ====================*/}
                        <Route path="/roles" element={<RolesPage view="roles"/>}/>
                        <Route path="/roles/:id" element={<RolesPage view="dashboard"/>}/>
                        <Route path="/roles/:id/permissions" element={<RolesPage view="permissions"/>}/>
                        <Route path="/roles/:id/users" element={<RolesPage view="users"/>}/>

                        {/*==================== EDIT STUDENTS ====================*/}
                        <Route path="/students" element={<StudentsPage/>}/>
                        {/*==================== EDIT EMPLOYEES ====================*/}
                        <Route path="/employees" element={<EmployeesPage/>}/>

                        {/*==================== VIEW SCHEDULES MAIN ====================*/}
                        <Route path="/schedules" element={<ChooseScheduleTypePage/>}/>

                        {/*==================== VIEW SCHEDULES FACILITIES ====================*/}
                        <Route path="/schedules/rooms/campus" element={<SchedulesFacilitiesPage view="campuses"/>}/>
                        <Route path="/schedules/rooms/campus/:campusId/building"
                               element={<SchedulesFacilitiesPage view="buildings"/>}/>
                        <Route path="/schedules/rooms/campus/:campusId/building/:buildingId/room"
                               element={<SchedulesFacilitiesPage view="rooms"/>}/>
                        <Route path="/schedules/rooms/campus/:campusId/building/:buildingId/room/:roomId"
                               element={<RoomSchedulePage/>}/>

                        {/*==================== VIEW SCHEDULES STUDENTS ====================*/}
                        <Route path="/schedules/study/faculty" element={<StudentsSchedulesPage view="faculties"/>}/>
                        <Route path="/schedules/study/faculty/:facultyId/field"
                               element={<StudentsSchedulesPage view="fields"/>}/>
                        <Route path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester"
                               element={<StudentsSchedulesPage view="semesters"/>}/>

                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/major"
                            element={<StudentsSchedulesPage view="majors"/>}/>
                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/group"
                            element={<StudentsSchedulesPage view="groups"/>}/>
                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/major/:majorId/group"
                            element={<StudentsSchedulesPage view="groups"/>}/>

                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/schedule"
                            element={<StudentSchedulePage/>}/>
                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/major/:majorId/schedule"
                            element={<StudentSchedulePage/>}/>
                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/group/:groupId/schedule"
                            element={<StudentSchedulePage/>}/>
                        <Route
                            path="/schedules/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/major/:majorId/group/:groupId/schedule"
                            element={<StudentSchedulePage/>}/>

                        {/*==================== VIEW schedules LECTURERS ====================*/}
                        <Route path="/schedules/lecturers/faculty"
                               element={<EmployeesSchedulesPage view="faculties"/>}/>
                        <Route path="/schedules/lecturers/faculty/:facultyId/unit"
                               element={<EmployeesSchedulesPage view="units"/>}/>
                        <Route path="/schedules/lecturers/faculty/:facultyId/unit/:unitId/lecturer"
                               element={<EmployeesSchedulesPage view="lecturers"/>}/>
                        <Route path="/schedules/lecturers/faculty/:facultyId/unit/:unitId/lecturer/:lecturerId"
                               element={<EmployeeSchedulePage/>}/>

                        {/*==================== DIDACTICS - COURSES AND FIELDS ====================*/}
                        <Route path="/didactics">
                            <Route index element={<DidacticsPage view="dashboard"/>}/>

                            <Route path="fields" element={<DidacticsPage view="faculties_for_fields"/>}/>
                            <Route path="fields/faculty/:facultyId" element={<DidacticsPage view="fields"/>}/>
                            <Route path="fields/faculty/:facultyId/field/:fieldId"
                                   element={<DidacticsPage view="field_dashboard"/>}/>
                            <Route path="fields/faculty/:facultyId/field/:fieldId/majors"
                                   element={<DidacticsPage view="majors"/>}/>
                            <Route path="fields/faculty/:facultyId/field/:fieldId/blocks"
                                   element={<DidacticsPage view="blocks"/>}/>

                            <Route path="courses" element={<DidacticsPage view="faculties_for_courses"/>}/>
                            <Route path="courses/faculty/:facultyId"
                                   element={<DidacticsPage view="units_for_courses"/>}/>
                            <Route path="courses/faculty/:facultyId/unit/:unitId"
                                   element={<DidacticsPage view="catalog"/>}/>
                            <Route path="courses/faculty/:facultyId/unit/:unitId/course/:courseCode/instructors"
                                   element={<DidacticsPage view="course_instructors"/>}/>
                        </Route>
                    </Route>

                    {/*==================== DEFAULT ====================*/}
                    <Route
                        path="/"
                        element={
                            isAuthenticated
                                ? <Navigate to="/plan" replace/>
                                : <Navigate to="/login" replace/>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace/>}/>

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoute;