import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the auth token cookie
    response.cookies.delete('userId');

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    );
  }
}