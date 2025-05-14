
  document.addEventListener("DOMContentLoaded", async() => {
    await checkAndRedirectIfAuthenticated();
  });

  function getStoredUserAndToken() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("token");
    return { user, token };
  }

async function isUserAuthenticated(token) {
    try {
      const response = await fetch("http://localhost:3000/auth/current-user", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      return response.ok;
    } catch (error) {
      console.error("Error verifying user:", error);
      return false;
    }
  }

async function checkAndRedirectIfAuthenticated() {
    const { user, token } = getStoredUserAndToken();
    console.log(user , token)
    if (user && token) {
      const authenticated = await isUserAuthenticated(token);
      console.log(authenticated)
      if (authenticated) {
        switch (user.role) {
            case "teacher":
                console.log("going to teacher db")

                window.location.href = "/pages/teacher/teacherView.html"
                break;
            case "student":
                console.log("going to student db")

                window.location.href = "/pages/student/studentView.html"
                break;
            default:
                break;
        }
      } else {
        // window.location.href = ""
        console.log("Invalid session or token.");
      }
    }
  }
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}
