import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import MainLayout from '@components/Layout/MainLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ActivationPage from './pages/Auth/ActivationPage.tsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage.tsx';
import MyPlan from './pages/Plan/MyPlan.tsx';
import ProtectedRoute from './components/Login/ProtectedRoute';
import RoomSchedulePage from "./pages/Plans/RoomPlan/RoomSchedulePage.tsx";
import ChoosePlanPage from "./pages/Plans/ChoosePlanPage.tsx";
import CampusSelectPage from "./pages/Plans/RoomPlan/CampusSelectPage.tsx";
import BuildingSelectPage from "./pages/Plans/RoomPlan/BuildingSelectPage.tsx";
import RoomSelectPage from "./pages/Plans/RoomPlan/RoomSelectPage.tsx";
import StudyPlanYearPage from "./pages/Plans/GeneralPlans/StudyPlanYearPage.tsx";
import StudyPlanSchedulePage from "./pages/Plans/GeneralPlans/StudyPlanSchedulePage.tsx";
import StudyPlanElectiveBlockPage from "./pages/Plans/GeneralPlans/StudyPlanElectiveBlockPage.tsx";
import StudyPlanFieldPage from "./pages/Plans/GeneralPlans/StudyPlanFieldPage.tsx";
import StudyPlanSemesterPage from "./pages/Plans/GeneralPlans/StudyPlanSemesterPage.tsx";
import StudyPlanSpecializationPage from "./pages/Plans/GeneralPlans/StudyPlanSpecializationPage.tsx";
import {useAuthStore} from '@store/useAuthStore';
import FacilitiesPage from "./pages/Facilities/FacilitiesPage.tsx";

import LecturerDepartmentSelectPage from "./pages/Plans/LecturerPlan/LecturerDepartmentSelectPage.tsx";
import LecturerSelectPage from "./pages/Plans/LecturerPlan/LecturerSelectPage.tsx";
import LecturerSchedulePage from "./pages/Plans/LecturerPlan/LecturerSchedulePage.tsx";
import StructuresPage from "./pages/Structures/StructuresPage.tsx";
import StudentsPage from "./pages/Students/StudentsPage.tsx";
import EmployeesPage from "./pages/Employees/EmployeesPage.tsx";

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

                        <Route path="/students" element={<StudentsPage/>}/>
                        <Route path="/employees" element={<EmployeesPage/>}/>

                        <Route path="/plans" element={<ChoosePlanPage/>}/>


                        <Route path="/plans/rooms/campus" element={<CampusSelectPage/>}/>
                        <Route path="/plans/rooms/campus/:campusId/building" element={<BuildingSelectPage/>}/>
                        <Route
                            path="/plans/rooms/campus/:campusId/building/:buildingId/room"
                            element={<RoomSelectPage/>}
                        />
                        <Route
                            path="/plans/rooms/campus/:campusId/building/:buildingId/room/:roomId"
                            element={<RoomSchedulePage/>}
                        />


                        <Route path="/plans/study/year" element={<StudyPlanYearPage/>}/>
                        <Route
                            path="/plans/study/year/:curriculumYearId/field"
                            element={<StudyPlanFieldPage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester"
                            element={<StudyPlanSemesterPage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/specialization"
                            element={<StudyPlanSpecializationPage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/elective-block"
                            element={<StudyPlanElectiveBlockPage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/elective-block"
                            element={<StudyPlanElectiveBlockPage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/plan"
                            element={<StudyPlanSchedulePage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/plan"
                            element={<StudyPlanSchedulePage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/elective-block/:electiveBlockId/plan"
                            element={<StudyPlanSchedulePage/>}
                        />
                        <Route
                            path="/plans/study/year/:curriculumYearId/field/:fieldOfStudyId/semester/:semesterId/specialization/:specializationId/elective-block/:electiveBlockId/plan"
                            element={<StudyPlanSchedulePage/>}
                        />


                        <Route path="/plans/lecturers/department" element={<LecturerDepartmentSelectPage/>}/>
                        <Route
                            path="/plans/lecturers/department/:departmentId/lecturer"
                            element={<LecturerSelectPage/>}
                        />
                        <Route
                            path="/plans/lecturers/department/:departmentId/lecturer/:lecturerId"
                            element={<LecturerSchedulePage/>}
                        />
                    </Route>
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
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoute;