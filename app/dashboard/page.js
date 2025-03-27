"use client";
import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/navbar";
import CirclesBackground from "@/components/background";
import Footer from "@/components/footer";

export default function dashboard() {
  return (
    <>
      <Dashboard />
      {/* <CirclesBackground height={window.innerHeight} /> */}
      <Footer/>
    </>
  );
}