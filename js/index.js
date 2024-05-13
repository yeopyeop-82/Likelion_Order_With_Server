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

function getOrderList(accessToken) {
  return fetch(API_SERVER_DOMAIN + "/order/orders", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch order list");
    }
    return response.json();
  });
}

function getOrder(accessToken, orderId) {
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

document.addEventListener("DOMContentLoaded", function () {
  // 페이지 로드 시 실행되는 코드

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

    // 주문 목록 가져오기
    getOrderList(accessToken)
      .then((orders) => {
        // 주문 목록을 처리하는 코드 추가
        var orderTableBody = document.getElementById("orderTableBody");
        var total = 0; // 총합계 초기값 설정
        orders.forEach((order) => {
          var row = document.createElement("tr");
          var totalPrice = order.quantity * order.price; // TotalPrice 계산
          total += totalPrice; // 총합계 계산
          row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.name}</td>
        <td>${order.quantity}</td>
        <td>${order.price}</td>
        <td>${totalPrice}</td>
      `;
          orderTableBody.appendChild(row);
        });

        // 총합계 및 TotalPrice를 마지막 열에 추가
        var totalRow = document.createElement("tr");
        totalRow.innerHTML = `
      <td colspan="4">Total:</td>
      <td>${total}</td>
    `;
        orderTableBody.appendChild(totalRow);
      })
      .catch((error) => {
        console.error("Failed to fetch order list:", error);
      });
  }
});
