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

function deleteOrder(accessToken, orderId) {
  return fetch(API_SERVER_DOMAIN + `/order?id=${orderId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to delete order");
    }
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
        var orderContainer = document.getElementById("orderContainer");

        orders.forEach((order) => {
          var card = document.createElement("div");
          card.className = "col-12 mb-4";
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
                  <div class="col-auto">
                    <i class="fas fa-trash-alt delete-icon" style="color: red; cursor: pointer;"></i>
                  </div>
                </div>
              </div>
            </div>
          `;
          // 주문 삭제 이벤트 추가
          var deleteIcon = card.querySelector(".delete-icon");
          deleteIcon.addEventListener("click", function () {
            var confirmDelete = confirm("정말 삭제하시겠습니까?");
            if (confirmDelete) {
              deleteOrder(accessToken, order.id)
                .then(() => {
                  // 삭제 성공 시 해당 카드를 제거
                  card.remove();
                })
                .catch((error) => {
                  console.error("Failed to delete order:", error);
                });
            }
          });
          card.addEventListener("click", function () {
            window.location.href = `/orderDetail.html?id=${order.id}`;
          });
          orderContainer.appendChild(card);
        });
      })
      .catch((error) => {
        console.error("Failed to fetch order list:", error);
      });
  }
});
