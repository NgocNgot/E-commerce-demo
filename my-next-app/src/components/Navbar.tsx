import Link from "next/link";

export default function Navbar() {
    return (
      <div className="relative bg-white shadow-md">
        <div className="container bg-white shadow-md mx-auto flex justify-between items-center py-2 px-6">
          <Link href="/" className="text-xl font-bold text-gray-800">
            My Blog
          </Link>
          <ul className="flex space-x-6">
            <li>
              <Link href="#" className="text-gray-600 hover:text-gray-800">
                Home
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-600 hover:text-gray-800">
                About
              </Link>
            </li>
            <li>
              <Link href="#" className="text-gray-600 hover:text-gray-800">
                Contact
              </Link>
            </li>
          </ul>
          <Link href="#" className="bg-cyan-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-cyan-900 transition">
            Sign In
          </Link>
        </div>
      </div>
    );
}