import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import MainLayout from '@components/Layout/MainLayout';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ActivationPage from './pages/Auth/ActivationPage.tsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage.tsx';
import ProtectedRoute from './routing/ProtectedRoute.tsx';
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
import SettingsPage from "./pages/Settings/SettingsPage.tsx";
import APIKeysPage from "./pages/PublicAPI/APIKeysPage.tsx";
import SchedulesFacilitiesPage from "./pages/Schedules/FacilitiesSchedulesPage.tsx";
import RoomSchedulePage from "./pages/Schedules/RoomSchedulePage.tsx";
import StudentSchedulePage from "./pages/Schedules/StudentSchedulePage.tsx";
import StudentsSchedulesPage from "./pages/Schedules/StudentsSchedulesPage.tsx";
import DidacticsPage from "./pages/Didactics/DidacticsPage.tsx";
import GenerateSchedulePage from "./pages/GenerateSchedule/GenerateSchedulePage.tsx";
import ChatPage from "./pages/Chat/ChatPage.tsx";
import SuggestionsPage from "./pages/Suggestions/SuggestionsPage.tsx";
import SessionExpiredDialog from '@components/Login/SessionExpiredDialog';
import {PermissionRoute} from './routing/PermissionRoute.tsx';
import {getFirstAccessiblePath} from './routing/access';
import {usePermissionStore} from '@store/usePermissionStore';
import {PermissionAnyRoute} from './routing/PermissionAnyRoute.tsx';
import {PERMISSIONS} from '@constants/permissions';

function DefaultRedirect() {
    const isAuthenticated = useAuthStore((state) => state.token !== null);
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    const firstAccessiblePath = getFirstAccessiblePath(hasAnyPermission);

    return <Navigate to={firstAccessiblePath ?? '/login'} replace/>;
}

function AppRoute() {
    return (
        <BrowserRouter>
            <SessionExpiredDialog/>
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
                        <Route element={<PermissionRoute section="MY_PLAN"/>}>
                            <Route path="/plan" element={<MySchedule/>}/>
                        </Route>

                        {/*==================== CHAT ====================*/}
                        <Route element={<PermissionRoute section="CHAT"/>}>
                            <Route path="/chat" element={<ChatPage/>}/>
                        </Route>

                        {/*==================== SUGGESTIONS ====================*/}
                        <Route element={<PermissionRoute section="SUGGESTIONS"/>}>
                            <Route path="/suggestions" element={<SuggestionsPage/>}/>
                        </Route>

                        {/*==================== EDIT FACILITIES ====================*/}
                        <Route element={<PermissionRoute section="FACILITIES"/>}>
                            <Route path="/facilities" element={<FacilitiesPage view="campuses"/>}/>
                            <Route path="/facilities/campus/:campusId" element={<FacilitiesPage view="buildings"/>}/>
                            <Route path="/facilities/campus/:campusId/building/:buildingId"
                                   element={<FacilitiesPage view="rooms"/>}/>
                        </Route>

                        {/*==================== EDIT STRUCTURES ====================*/}
                        <Route element={<PermissionRoute section="STRUCTURES"/>}>

                            <Route path="/structures" element={<StructuresPage view="faculties"/>}/>
                            <Route path="/structures/faculty/:facultyId" element={<StructuresPage view="units"/>}/>
                        </Route>

                        {/*==================== EDIT USERS ====================*/}
                        <Route element={<PermissionRoute section="USERS"/>}>
                            <Route path="/users" element={<UsersPage/>}/>
                        </Route>

                        {/*==================== SETTINGS ====================*/}
                        <Route element={<PermissionRoute section="SETTINGS"/>}>
                            <Route path="/settings" element={<SettingsPage/>}/>
                        </Route>

                        {/*==================== API KEYS ====================*/}
                        <Route element={<PermissionRoute section="PUBLIC_API"/>}>
                            <Route path="/public-api" element={<APIKeysPage/>}/>
                        </Route>

                        {/*==================== EDIT ROLES ====================*/}
                        <Route element={<PermissionRoute section="PERMISSIONS"/>}>
                            <Route path="/roles" element={<RolesPage view="roles"/>}/>

                            <Route
                                element={
                                    <PermissionAnyRoute
                                        permissions={[
                                            PERMISSIONS.USERS_VIEW,
                                            PERMISSIONS.PERMISSIONS_VIEW,
                                            PERMISSIONS.ROLE_VIEW
                                        ]}
                                        fallbackPath="/roles"
                                    />
                                }
                            >
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.USERS_VIEW,
                                                PERMISSIONS.PERMISSIONS_VIEW,
                                            ]}
                                            fallbackPath="/roles"
                                        />
                                    }
                                >
                                    <Route path="/roles/:id" element={<RolesPage view="dashboard"/>}/>
                                </Route>
                            </Route>

                            <Route
                                element={
                                    <PermissionAnyRoute
                                        permissions={[
                                            PERMISSIONS.PERMISSIONS_VIEW,
                                        ]}
                                        fallbackPath="/roles"
                                    />
                                }
                            >
                                <Route path="/roles/:id/permissions" element={<RolesPage view="permissions"/>}/>
                            </Route>

                            <Route
                                element={
                                    <PermissionAnyRoute
                                        permissions={[
                                            PERMISSIONS.USERS_VIEW,
                                        ]}
                                        fallbackPath="/roles"
                                    />
                                }
                            >
                                <Route path="/roles/:id/users" element={<RolesPage view="users"/>}/>
                            </Route>
                        </Route>

                        {/*==================== EDIT STUDENTS ====================*/}
                        <Route element={<PermissionRoute section="STUDENTS"/>}>
                            <Route path="/students" element={<StudentsPage/>}/>
                        </Route>

                        {/*==================== EDIT EMPLOYEES ====================*/}
                        <Route element={<PermissionRoute section="EMPLOYEES"/>}>
                            <Route path="/employees" element={<EmployeesPage/>}/>
                        </Route>

                        {/*==================== VIEW SCHEDULES MAIN ====================*/}
                        <Route element={<PermissionRoute section="PLANS"/>}>
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
                        </Route>

                        {/*==================== GENERATE PLAN ====================*/}
                        <Route element={<PermissionRoute section="GENERATE_SCHEDULE"/>}>
                            <Route path="/generate" element={<GenerateSchedulePage/>}/>
                        </Route>

                        {/*==================== DIDACTICS - COURSES AND FIELDS ====================*/}
                        <Route element={<PermissionRoute section="DIDACTICS"/>}>
                            <Route path="/didactics">
                                <Route index element={<DidacticsPage view="dashboard"/>}/>

                                {/* STUDY FIELDS BASE */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.STUDY_FIELDS_VIEW,
                                                PERMISSIONS.STUDY_FIELD_VIEW,
                                                PERMISSIONS.FACULTIES_VIEW,
                                                PERMISSIONS.FACULTY_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route path="fields" element={<DidacticsPage view="faculties_for_fields"/>}/>
                                    <Route path="fields/faculty/:facultyId" element={<DidacticsPage view="fields"/>}/>
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId"
                                        element={<DidacticsPage view="field_dashboard"/>}
                                    />
                                </Route>

                                {/* MAJORS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.MAJORS_VIEW,
                                                PERMISSIONS.MAJOR_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/majors"
                                        element={<DidacticsPage view="majors"/>}
                                    />
                                </Route>

                                {/* ELECTIVE BLOCKS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.ELECTIVE_BLOCKS_VIEW,
                                                PERMISSIONS.ELECTIVE_BLOCK_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/blocks"
                                        element={<DidacticsPage view="blocks"/>}
                                    />
                                </Route>

                                {/* STUDY PROGRAMS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.STUDY_PROGRAMS_VIEW,
                                                PERMISSIONS.STUDY_PROGRAM_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/programs"
                                        element={<DidacticsPage view="programs"/>}
                                    />
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/program/:programId"
                                        element={<DidacticsPage view="semesters"/>}
                                    />
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/program/:programId/semester/:semesterId"
                                        element={<DidacticsPage view="semester-dashboard"/>}
                                    />
                                </Route>

                                {/* CURRICULUM */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.CURRICULUMS_VIEW,
                                                PERMISSIONS.CURRICULUM_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/program/:programId/semester/:semesterId/curriculum"
                                        element={<DidacticsPage view="curriculum"/>}
                                    />
                                </Route>

                                {/* GROUPS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.GROUPS_VIEW,
                                                PERMISSIONS.GROUP_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/program/:programId/semester/:semesterId/groups"
                                        element={<DidacticsPage view="groups"/>}
                                    />
                                </Route>

                                {/* GROUP MEMBERS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.GROUP_MEMBERS_VIEW,
                                                PERMISSIONS.GROUP_MEMBER_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="fields/faculty/:facultyId/field/:fieldId/program/:programId/semester/:semesterId/groups/:groupId"
                                        element={<DidacticsPage view="group_members"/>}
                                    />
                                </Route>

                                {/* COURSES BASE */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.UNITS_VIEW,
                                                PERMISSIONS.UNIT_VIEW,
                                                PERMISSIONS.COURSES_VIEW,
                                                PERMISSIONS.COURSE_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route path="courses" element={<DidacticsPage view="faculties_for_courses"/>}/>
                                    <Route
                                        path="courses/faculty/:facultyId"
                                        element={<DidacticsPage view="units_for_courses"/>}
                                    />
                                    <Route
                                        path="courses/faculty/:facultyId/unit/:unitId"
                                        element={<DidacticsPage view="catalog"/>}
                                    />
                                </Route>

                                {/* COURSE INSTRUCTORS */}
                                <Route
                                    element={
                                        <PermissionAnyRoute
                                            permissions={[
                                                PERMISSIONS.COURSE_INSTRUCTOR_VIEW,
                                            ]}
                                            fallbackPath="/didactics"
                                        />
                                    }
                                >
                                    <Route
                                        path="courses/faculty/:facultyId/unit/:unitId/course/:courseCode/instructors"
                                        element={<DidacticsPage view="course_instructors"/>}
                                    />
                                </Route>
                            </Route>
                        </Route>
                    </Route>


                    {/*==================== DEFAULT ====================*/}
                    <Route path="/" element={<DefaultRedirect/>}/>
                    <Route path="*" element={<Navigate to="/" replace/>}/>

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoute;