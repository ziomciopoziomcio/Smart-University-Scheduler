import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import MainLayout from '@components/Layout/MainLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ActivationPage from './pages/Auth/ActivationPage.tsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage.tsx';
import MyPlan from './pages/Plan/MyPlan.tsx';
import ProtectedRoute from './components/Login/ProtectedRoute';
import ChooseScheduleTypePage from "./pages/Plans/ChooseScheduleTypePage.tsx";
import StudyPlanSchedulePage from "./pages/Plans/GeneralPlans/StudyPlanSchedulePage.tsx";
import StudyPlanFacultyPage from "./pages/Plans/GeneralPlans/StudyPlanFacultyPage.tsx";
import StudyPlanSemesterPage from "./pages/Plans/GeneralPlans/StudyPlanSemesterPage.tsx";
import StudyPlanSpecializationPage from "./pages/Plans/GeneralPlans/StudyPlanSpecializationPage.tsx";
import StudyPlanFieldPage from "./pages/Plans/GeneralPlans/StudyPlanFieldPage.tsx";
import StudyPlanSemesterGroupPage from "./pages/Plans/GeneralPlans/StudyPlanSemesterGroupPage.tsx";
import StudyPlanSpecializationGroupPage from "./pages/Plans/GeneralPlans/StudyPlanSpecializationGroupPage.tsx";
import {useAuthStore} from '@store/useAuthStore';
import FacilitiesPage from "./pages/Facilities/FacilitiesPage.tsx";
import LecturersSchedulesPage from './pages/Plans/LecturersSchedulesPage.tsx'
import LecturerSchedulePage from './pages/Plans/LecturerSchedulePage.tsx'
import StructuresPage from "./pages/Structures/StructuresPage.tsx";
import StudentsPage from "./pages/Students/StudentsPage.tsx";
import EmployeesPage from "./pages/Employees/EmployeesPage.tsx";
import UsersPage from "./pages/Users/UsersPage.tsx";
import RolesPage from "./pages/Roles/RolesPage.tsx";
import PlansFacilitiesPage from "./pages/Plans/FacilitiesSchedulesPage.tsx";
import RoomSchedulePage from "./pages/Plans/RoomSchedulePage.tsx";

function AppRoute() {
    const isAuthenticated = useAuthStore((state) => state.token !== null);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/activate" element={<ActivationPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>

                <Route element={<ProtectedRoute/>}>
                    <Route element={<MainLayout/>}>
                        <Route path="/plan" element={<MyPlan/>}/>

                        <Route path="/facilities" element={<FacilitiesPage view="campuses"/>}/>
                        <Route path="/facilities/campus/:campusId" element={<FacilitiesPage view="buildings"/>}/>
                        <Route path="/facilities/campus/:campusId/building/:buildingId"
                               element={<FacilitiesPage view="rooms"/>}/>

                        <Route path="/structures" element={<StructuresPage view="faculties"/>}/>
                        <Route path="/structures/faculty/:facultyId" element={<StructuresPage view="units"/>}/>

                        <Route path="/users" element={<UsersPage/>}/>

                        <Route path="/roles" element={<RolesPage view="roles"/>}/>
                        <Route path="/roles/:id" element={<RolesPage view="dashboard"/>}/>
                        <Route path="/roles/:id/permissions" element={<RolesPage view="permissions"/>}/>
                        <Route path="/roles/:id/users" element={<RolesPage view="users"/>}/>

                        <Route path="/students" element={<StudentsPage/>}/>
                        <Route path="/employees" element={<EmployeesPage/>}/>

                        <Route path="/plans" element={<ChooseScheduleTypePage/>}/>

                        <Route path="/plans/rooms/campus" element={<PlansFacilitiesPage view="campuses"/>}/>
                        <Route path="/plans/rooms/campus/:campusId/building"
                               element={<PlansFacilitiesPage view="buildings"/>}/>
                        <Route path="/plans/rooms/campus/:campusId/building/:buildingId/room"
                               element={<PlansFacilitiesPage view="rooms"/>}/>
                        <Route path="/plans/rooms/campus/:campusId/building/:buildingId/room/:roomId"
                               element={<RoomSchedulePage/>}/>

                        {/* STUDENTS PLANS */}
                        <Route path="/plans/study/faculty" element={<StudyPlanFacultyPage/>}/>
                        <Route path="/plans/study/faculty/:facultyId/field" element={<StudyPlanFieldPage/>}/>
                        <Route path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester"
                               element={<StudyPlanSemesterPage/>}/>
                        <Route
                            path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/specialization"
                            element={<StudyPlanSpecializationPage/>}/>
                        <Route path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/group"
                               element={<StudyPlanSemesterGroupPage/>}/>
                        <Route path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/plan"
                               element={<StudyPlanSchedulePage/>}/>
                        <Route
                            path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/group"
                            element={<StudyPlanSpecializationGroupPage/>}/>
                        <Route
                            path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/plan"
                            element={<StudyPlanSchedulePage/>}/>
                        <Route
                            path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/group/:groupId/plan"
                            element={<StudyPlanSchedulePage/>}/>
                        <Route
                            path="/plans/study/faculty/:facultyId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/group/:groupId/plan"
                            element={<StudyPlanSchedulePage/>}/>

                        {/* LECTURER PLANS */}
                        <Route path="/plans/lecturers/faculty" element={<LecturersSchedulesPage view="faculties"/>}/>
                        <Route path="/plans/lecturers/faculty/:facultyId/unit"
                               element={<LecturersSchedulesPage view="units"/>}/>
                        <Route path="/plans/lecturers/faculty/:facultyId/unit/:unitId/lecturer"
                               element={<LecturersSchedulesPage view="lecturers"/>}/>
                        <Route path="/plans/lecturers/faculty/:facultyId/unit/:unitId/lecturer/:lecturerId"
                               element={<LecturerSchedulePage/>}/>
                    </Route>

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