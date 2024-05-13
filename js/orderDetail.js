let container = document.getElementById("container");
let API_SERVER_DOMAIN = "https://likelionshop.shop";

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function getAccessTokenWithRefreshToken(accessToken, refreshToken) {
  return fetch(API_SERVER_DOMAIN + "/auth/reissue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: accessToken,
      refreshToken: refreshToken,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to refresh access token");
      }
      return response.json();
    })
    .then((data) => {
      return data.accessToken;
    });
}

function getUserInfo(accessToken) {
  return fetch(API_SERVER_DOMAIN + "/user", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("User info request failed");
      }
      return response.json();
    })
    .then((data) => {
      return data.name;
    });
}

function getOrderDetail(accessToken, orderId) {
  return fetch(API_SERVER_DOMAIN + `/order/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to ferch Order");
    }
    return response.json;
  });
}

function updateOrder(accessToken, orderData) {
  return fetch(API_SERVER_DOMAIN + "/order", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to update Order");
    }
    return response.json;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // 페이지 로드 시 실행되는 코드

  // URL에서 주문 ID를 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  // 쿠키에서 accessToken 가져오기
  var accessToken = getCookie("accessToken");
  var refreshToken = getCookie("refreshToken");

  if (accessToken) {
    // accessToken이 있는 경우, 서버에 사용자 정보 요청
    getUserInfo(accessToken)
      .then((name) => {
        var userNameSpans = document.querySelectorAll(".user-name");
        userNameSpans.forEach((span) => {
          span.textContent = name;
          span.classList.remove("d-none");
        });
        console.log(accessToken);
      })
      .catch((error) => {
        console.error("User info error:", error);
        // accessToken이 만료된 경우 refresh 토큰을 사용하여 새로운 accessToken을 가져옴
        if (refreshToken) {
          getAccessTokenWithRefreshToken(accessToken, refreshToken)
            .then((newAccessToken) => {
              // 새로운 accessToken으로 사용자 정보 요청
              getUserInfo(newAccessToken)
                .then((name) => {
                  var userNameSpans = document.querySelectorAll(".user-name");
                  userNameSpans.forEach((span) => {
                    span.textContent = name;
                    span.classList.remove("d-none");
                  });
                })
                .catch((error) => {
                  console.error(
                    "User info error after refreshing token:",
                    error
                  );
                });
            })
            .catch((error) => {
              console.error("Failed to refresh access token:", error);
            });
        }
      });
  }

  getOrderDetail(accessToken, orderId)
    .then((order) => {
      var orderContainer = document.getElementById("orderContainer");

      var card = document.createElement("div");
      card.className = "col-xl-3 col-md-6 mb-4";
      card.innerHTML = `
      <div class="card border-left-primary shadow h-100 py-2">
        <div class="card-body">
          <div class="row no-gutters align-items-center">
            <div class="col mr-2">
              <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                주문 ID : <span>${order.id}</span>
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                <span>${order.name}</span>
                <span>(${order.price}원)</span>
                <span>${order.quantity}개</span>
                <span> / ${order.quantity * order.price}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

      orderContainer.appendChild(card);
    })
    .catch((error) => {
      console.error("Failed to fetch order detail:", error);
    });
});
