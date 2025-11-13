import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'
import Employeedashboard from '../pages/Employeedashboard'
import Leads from '../pages/crm/Leads'
import Bookings from '../pages/crm/Bookings'
import Payments from '../pages/crm/Payments'
import Reports from '../pages/crm/Reports'
import Itineraries from '../pages/cms/Itineraries'
import ItineraryBuilder from '../pages/cms/ItineraryBuilder'
import Blogs from '../pages/cms/Blogs'
import Suppliers from '../pages/cms/Suppliers'
import Destinations from '../pages/cms/Destinations'
import RoomTypes from '../pages/cms/RoomTypes'
import Activities from '../pages/cms/Activities'
import MealPlans from '../pages/cms/MealPlans'
import Hotels from '../pages/cms/Hotels'
import Transfers from '../pages/cms/Transfers'
import DayItinerary from '../pages/cms/DayItinerary'
import PackageTheme from '../pages/cms/PackageTheme'
import QueryStatus from '../pages/cms/QueryStatus'
import PricingTaxRule from '../pages/cms/PricingTaxRule'
import Policy from '../pages/cms/Policy'
import VehicleDriver from '../pages/cms/VehicleDriver'
import ItineraryTemplate from '../pages/cms/ItineraryTemplate'
import MediaLibrary from '../pages/cms/MediaLibrary'
import ItineraryNotesInclusions from '../pages/cms/ItineraryNotesInclusions'
import UserRoleAccess from '../pages/cms/UserRoleAccess'
import LeadSourceDetailed from '../pages/cms/LeadSourceDetailed'
import LeadTypeMaster from '../pages/cms/LeadTypeMaster'
import LeadScoringMaster from '../pages/cms/LeadScoringMaster'
import VendorPayoutMaster from '../pages/cms/VendorPayoutMaster'
import ExpenseTrackingMaster from '../pages/cms/ExpenseTrackingMaster'
import ProfitCalculationMaster from '../pages/cms/ProfitCalculationMaster'
import Settings from '../pages/Settings'
import WebsiteEdit from '../pages/cms/WebsiteEdit'
import Employees from '../pages/Employees'
import Queries from '../pages/Queries'
import QueryDetail from '../pages/QueryDetail'
import GuestDocuments from '../pages/GuestDocuments'
import Login from '../../pages/Login'
import ProtectedRoute from '../auth/ProtectedRoute'
import MainWebsiteEdit from '../pages/cms/MainWebsiteEdit'
import VehicleTypes from '../pages/cms/VehicleTypes'
import HotelRates from '../pages/cms/HotelRates'
const Routers: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employee" element={
        <ProtectedRoute>
          <Employeedashboard />
        </ProtectedRoute>
      } />
      <Route path="/queries" element={
        <ProtectedRoute>
          <Queries />
        </ProtectedRoute>
      } />
      <Route path="/queries/:id" element={
        <ProtectedRoute>
          <QueryDetail />
        </ProtectedRoute>
      } />
      <Route path="/guest-documents" element={
        <ProtectedRoute>
          <GuestDocuments />
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute>
          <Bookings />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/packages" element={
        <ProtectedRoute>
          <Itineraries />
        </ProtectedRoute>
      } />
      <Route path="/packages/:id" element={
        <ProtectedRoute>
          <ItineraryBuilder />
        </ProtectedRoute>
      } />
      <Route path="/blogs" element={
        <ProtectedRoute>
          <Blogs />
        </ProtectedRoute>
      } />
      <Route path="/website-edit" element={
        <ProtectedRoute>
          <WebsiteEdit />
        </ProtectedRoute>
      } />
      <Route path="/main-website-edit" element={
        <ProtectedRoute>
          <MainWebsiteEdit />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/admin" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/suppliers" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Suppliers />
        </ProtectedRoute>
      } />
      <Route path="/settings/destinations" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Destinations />
        </ProtectedRoute>
      } />
      <Route path="/settings/room-types" element={
        <ProtectedRoute requiredRole="Super Admin">
          <RoomTypes />
        </ProtectedRoute>
      } />
      <Route path="/settings/activity" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Activities />
        </ProtectedRoute>
      } />
      <Route path="/settings/meal-plan" element={
        <ProtectedRoute requiredRole="Super Admin">
          <MealPlans />
        </ProtectedRoute>
      } />
      <Route path="/settings/hotels" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Hotels />
        </ProtectedRoute>
      } />
      <Route path="/settings/hotel-rates" element={
        <ProtectedRoute requiredRole="Super Admin">
          <HotelRates />
        </ProtectedRoute>
      } />
      <Route path="/settings/transfer" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Transfers />
        </ProtectedRoute>
      } />
      <Route path="/settings/vehicle-types" element={
        <ProtectedRoute requiredRole="Super Admin">
          <VehicleTypes />
        </ProtectedRoute>
      } />
      <Route path="/settings/lead-source-detailed" element={
        <ProtectedRoute requiredRole="Super Admin">
          <LeadSourceDetailed />
        </ProtectedRoute>
      } />
      <Route path="/settings/lead-type-master" element={
        <ProtectedRoute requiredRole="Super Admin">
          <LeadTypeMaster />
        </ProtectedRoute>
      } />
      <Route path="/settings/lead-scoring-master" element={
        <ProtectedRoute requiredRole="Super Admin">
          <LeadScoringMaster />
        </ProtectedRoute>
      } />
      <Route path="/settings/vendor-payout-master" element={
        <ProtectedRoute requiredRole="Super Admin">
          <VendorPayoutMaster />
        </ProtectedRoute>
      } />
      <Route path="/settings/expense-tracking-master" element={
        <ProtectedRoute requiredRole="Super Admin">
          <ExpenseTrackingMaster />
        </ProtectedRoute>
      } />
      <Route path="/settings/profit-calculation-master" element={
        <ProtectedRoute requiredRole="Super Admin">
          <ProfitCalculationMaster />
        </ProtectedRoute>
      } />
      <Route path="/settings/day-itinerary" element={
        <ProtectedRoute requiredRole="Super Admin">
          <DayItinerary />
        </ProtectedRoute>
      } />
      <Route path="/settings/package-theme" element={
        <ProtectedRoute requiredRole="Super Admin">
          <PackageTheme />
        </ProtectedRoute>
      } />
      <Route path="/settings/query-status" element={
        <ProtectedRoute requiredRole="Super Admin">
          <QueryStatus />
        </ProtectedRoute>
      } />
      <Route path="/settings/pricing-tax-rule" element={
        <ProtectedRoute requiredRole="Super Admin">
          <PricingTaxRule />
        </ProtectedRoute>
      } />
      <Route path="/settings/policy" element={
        <ProtectedRoute requiredRole="Super Admin">
          <Policy />
        </ProtectedRoute>
      } />
      <Route path="/settings/vehicle-driver" element={
        <ProtectedRoute requiredRole="Super Admin">
          <VehicleDriver />
        </ProtectedRoute>
      } />
      <Route path="/settings/itinerary-template" element={
        <ProtectedRoute requiredRole="Super Admin">
          <ItineraryTemplate />
        </ProtectedRoute>
      } />
      <Route path="/settings/media-library" element={
        <ProtectedRoute requiredRole="Super Admin">
          <MediaLibrary />
        </ProtectedRoute>
      } />
      <Route path="/settings/itinerary-notes-inclusions" element={
        <ProtectedRoute requiredRole="Super Admin">
          <ItineraryNotesInclusions />
        </ProtectedRoute>
      } />
      <Route path="/settings/user-role-access" element={
        <ProtectedRoute requiredRole="Super Admin">
          <UserRoleAccess />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default Routers
