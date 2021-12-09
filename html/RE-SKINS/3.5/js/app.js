var InventoryOption = "120, 10, 20";

var totalWeight = 0;
var totalWeightOther = 0;

var playerMaxWeight = 0;
var otherMaxWeight = 0;

var otherLabel = "";

var ClickedItemData = {};

var SelectedAttachment = null;
var AttachmentScreenActive = false;
var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;

var IsDragging = false;
var TimeDurability = 0;
var QualityData = {};


$(document).on('keydown', function () {
    if (event.repeat) { return }
    switch (event.keyCode) {
        case 27: // ESC
            Inventory.Close();
            break;
        case 113: // ESC
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // TAB
            ControlPressed = true;
            break;
    }
});

$(document).on('keyup', function () {
    switch (event.keyCode) {
        case 17: // TAB
            ControlPressed = false;
            break;
    }
});


$(document).on("mouseenter", ".item-slot", function (e) {
    e.preventDefault();
    $(".ply-iteminfo-container").css("opacity", "0.0");
    if ($(this).data("item") != null) {
        $(".ply-iteminfo-container").css("opacity", "1.0");
        FormatItemInfo($(this).data("item"), $(this));
    }
});

$(document).on("mouseleave", ".item-slot", function (e) {
    $(".ply-iteminfo-container").css("opacity", "0.0");
});


function closeInventory() {
    Inventory.Close();
}

function openHudMenu() {
    Inventory.Close();
    $.post('https://qb-inventory/OpenHudMenu');
}


// Autostack Quickmove
function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find('.item-slot'), function (i, slot) {
        if ($(slot).data('item') === undefined) {
            if (retval === null) {
                retval = (i + 1);
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;
    // if (otherinventory == "grond") {
    //     retval = false
    // } else if (otherinventory.split("-")[0] == "dropped") {
    //     retval = false;
    // }
    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }
    return retval;
}

// // using fast item // shift + right click Not Working
// $(document).on('mousedown', '.item-slot', function(event){
//     if(event.shiftKey) {
//         switch(event.which) {
//             case 1:
//             item = $(this).data('item') 
//             if (item != null) {
//                 if(item.usable) {
//                     fromInventory = $(this).parent();
//                     if ($(fromInventory).attr('data-inventory') == "player") {
//                         // if (item.shouldClose) {
//                         //     Inventory.Close();
//                         // }
//                         $.post("https://qb-inventory/UseItem", JSON.stringify({
//                             inventory: "player",
//                             item: item,
//                         }));
//                     }
//                 }
//             }
//             break;
//         }
//     }
// });

$(document).on("dblclick", ".item-slot", function (e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        $.post("http://qb-inventory/UseItem", JSON.stringify({
            inventory: ItemInventory,
            item: ItemData,
        }));
    }
});

$(document).on('mousedown', '.item-slot', function (event) {
    switch (event.which) {
        case 3:
            fromSlot = $(this).attr("data-slot");
            fromInventory = $(this).parent();

            if ($(fromInventory).attr('data-inventory') == "player") {
                toInventory = $(".other-inventory");
            } else {
                toInventory = $(".player-inventory");
            }
            toSlot = GetFirstFreeSlot(toInventory, $(this));
            if ($(this).data('item') === undefined) {
                return;
            }
            toAmount = $(this).data('item').amount;
            if (ControlPressed) {
                if (toAmount > 1) {
                    toAmount = Math.round(toAmount / 2)
                }
            }
            if (CanQuickMove()) {
                if (toSlot === null) {
                    InventoryError(fromInventory, fromSlot);
                    return;
                }
                if (fromSlot == toSlot && fromInventory == toInventory) {
                    return;
                }
                if (toAmount >= 0) {
                    if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                    }
                }
            } else {
                InventoryError(fromInventory, fromSlot);
            }
            break;
    }
});

$(document).on("click", ".item-slot", function (e) {
    e.preventDefault();
    var ItemData = $(this).data("item");

    if (ItemData !== null && ItemData !== undefined) {
        if (ItemData.name !== undefined) {
            if ((ItemData.name).split("_")[0] == "weapon") {
                if (!$("#weapon-attachments").length) {
                    // if (ItemData.info.attachments !== null && ItemData.info.attachments !== undefined && ItemData.info.attachments.length > 0) {
                    $(".inv-options-list").append('<div style="height: 100%;background-color:#444554;margin-top:29.4vh" class="inv-option-item" id="weapon-attachments"><p>ATTACHMENTS</p></div>');
                    $("#weapon-attachments").hide().fadeIn(250);
                    ClickedItemData = ItemData;
                    // }
                } else if (ClickedItemData == ItemData) {
                    $("#weapon-attachments").fadeOut(250, function () {
                        $("#weapon-attachments").remove();
                    });
                    ClickedItemData = {};
                } else {
                    ClickedItemData = ItemData;
                }
            } else {
                ClickedItemData = {};
                if ($("#weapon-attachments").length) {
                    $("#weapon-attachments").fadeOut(250, function () {
                        $("#weapon-attachments").remove();
                    });
                }
            }
        } else {
            ClickedItemData = {};
            if ($("#weapon-attachments").length) {
                $("#weapon-attachments").fadeOut(250, function () {
                    $("#weapon-attachments").remove();
                });
            }
        }
    } else {
        ClickedItemData = {};
        if ($("#weapon-attachments").length) {
            $("#weapon-attachments").fadeOut(250, function () {
                $("#weapon-attachments").remove();
            });
        }
    }
});

$(document).on('click', '.weapon-attachments-back', function (e) {
    e.preventDefault();
    $("#qbus-inventory").css({ "display": "block" });
    $("#qbus-inventory").animate({
        left: 0 + "vw"
    }, 200);
    $(".weapon-attachments-container").animate({
        left: -100 + "vw"
    }, 200, function () {
        $(".weapon-attachments-container").css({ "display": "none" });
    });
    AttachmentScreenActive = false;
});

function FormatAttachmentInfo(data) {
    $.post("http://qb-inventory/GetWeaponData", JSON.stringify({
        weapon: data.name,
        ItemData: ClickedItemData
    }), function (data) {
        var AmmoLabel = "pistol_ammo";
        var Durability = 100;
        if (data.WeaponData.ammotype == "rifle_ammo") {
            AmmoLabel = "7.62"
        } else if (data.WeaponData.ammotype == "shotgun_ammo") {
            AmmoLabel = "12 Gauge"
        }
        if (ClickedItemData.info.quality !== undefined) {
            Durability = ClickedItemData.info.quality;
        }

        $(".weapon-attachments-container-title").html(data.WeaponData.label + " | " + AmmoLabel);
        $(".weapon-attachments-container-description").html(data.WeaponData.description);
        $(".weapon-attachments-container-details").html('<span style="font-weight: bold; letter-spacing: .1vh;">Serial Number</span><br> ' + ClickedItemData.info.serie + '<br><br><span style="font-weight: bold; letter-spacing: .1vh;">Durability - ' + Durability.toFixed(2) + '% </span> <div class="weapon-attachments-container-detail-durability"><div class="weapon-attachments-container-detail-durability-total"></div></div>')
        $(".weapon-attachments-container-detail-durability-total").css({
            width: Durability + "%"
        });
        $(".weapon-attachments-container-image").attr('src', './attachment_images/' + data.WeaponData.name + '.png');
        $(".weapon-attachments").html("");

        if (data.AttachmentData !== null && data.AttachmentData !== undefined) {
            if (data.AttachmentData.length > 0) {
                $(".weapon-attachments-title").html('<span style="font-weight: bold; letter-spacing: .1vh;">Attachments</span>');
                $.each(data.AttachmentData, function (i, attachment) {
                    var WeaponType = (data.WeaponData.ammotype).split("_")[1].toLowerCase();
                    $(".weapon-attachments").append('<div class="weapon-attachment" id="weapon-attachment-' + i + '"> <div class="weapon-attachment-label"><p>' + attachment.label + '</p></div> <div class="weapon-attachment-img"><img src="./images/' + WeaponType + '_' + attachment.attachment + '.png"></div> </div>')
                    attachment.id = i;
                    $("#weapon-attachment-" + i).data('AttachmentData', attachment)
                });
            } else {
                $(".weapon-attachments-title").html('<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>');
            }
        } else {
            $(".weapon-attachments-title").html('<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>');
        }

        handleAttachmentDrag()
    });
}

var AttachmentDraggingData = {};

function handleAttachmentDrag() {
    $(".weapon-attachment").draggable({
        helper: 'clone',
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        start: function (event, ui) {
            var ItemData = $(this).data('AttachmentData');
            $(this).addClass('weapon-dragging-class');
            AttachmentDraggingData = ItemData
        },
        stop: function () {
            $(this).removeClass('weapon-dragging-class');
        },
    });
    $(".weapon-attachments-remove").droppable({
        accept: ".weapon-attachment",
        hoverClass: 'weapon-attachments-remove-hover',
        drop: function (event, ui) {
            $.post('http://qb-inventory/RemoveAttachment', JSON.stringify({
                AttachmentData: AttachmentDraggingData,
                WeaponData: ClickedItemData,
            }), function (data) {
                if (data.Attachments !== null && data.Attachments !== undefined) {
                    if (data.Attachments.length > 0) {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(150, function () {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                            AttachmentDraggingData = null;
                        });
                    } else {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(150, function () {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                            AttachmentDraggingData = null;
                            $(".weapon-attachments").html("");
                        });
                        $(".weapon-attachments-title").html('<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>');
                    }
                } else {
                    $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(150, function () {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                        AttachmentDraggingData = null;
                        $(".weapon-attachments").html("");
                    });
                    $(".weapon-attachments-title").html('<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>');
                }
            });
        },
    });
}

$(document).on('click', '#weapon-attachments', function (e) {
    e.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ "display": "block" })
        $("#qbus-inventory").animate({
            left: 100 + "vw"
        }, 200, function () {
            $("#qbus-inventory").css({ "display": "none" })
        });
        $(".weapon-attachments-container").animate({
            left: 0 + "vw"
        }, 200);
        AttachmentScreenActive = true;
        FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post('http://qb-inventory/Notify', JSON.stringify({
            message: "Attachments are unavailable for this gun.",
            type: "error"
        }))
    }
});

function FormatItemInfo(itemData, dom) {

    let element = $('.ply-iteminfo-container');
    let itemOffset = $(dom).offset();
    element.css('top', itemOffset.top - element.height());
    let leftOffset = itemOffset.left + 92;
    if (leftOffset + element.width() > $(window).width()) {
        leftOffset = $(window).width() - element.width() - 20;
    }
    element.css('left', leftOffset);


    if (itemData != null && itemData.info != "") {
        if (itemData.name == "id_card") {
            var gender = "Male";
            if (itemData.info.gender == 1) {
                gender = "Female";
            }
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Citizen ID: </strong><span>" +
                itemData.info.citizenid +
                "</span></p><p><strong>Name: </strong><span>" +
                itemData.info.firstname + " " + itemData.info.lastname +
                "</span></p><p><strong>Birth Date: </strong><span>" +
                itemData.info.birthdate +
                "</span></p><p><strong>Gender: </strong><span>" +
                gender +
                "</span></p><p><strong>Nationality: </strong><span>" +
                itemData.info.nationality +
                "</span></p><p><strong>Fingerprint: </strong><span>" +
                itemData.info.fingerprint +
                "</span></p>"
            );
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "driver_license") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "</span></p><p><strong>Name: </strong><span>" +
                itemData.info.firstname + " " + itemData.info.lastname +
                "</span></p><p><strong>Birth Date: </strong><span>" +
                itemData.info.birthdate +
                "</span></p><p><strong>Licenses: </strong><span>" +
                itemData.info.type +
                "</span></p>"
            );
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "weaponlicense") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>First Name: </strong><span>" +
                itemData.info.firstname +
                "</span></p><p><strong>Last Name: </strong><span>" +
                itemData.info.lastname +
                "</span></p><p><strong>Licenses: </strong><span>" +
                itemData.info.type +
                "</span></p>"
            );
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "lawyerpass") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Pass-ID: </strong><span>' + itemData.info.id + '</span></p><p><strong>First Name: </strong><span>' + itemData.info.firstname + '</span></p><p><strong>Last Name: </strong><span>' + itemData.info.lastname + '</span></p><p><strong>CSN: </strong><span>' + itemData.info.citizenid + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "harness") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>' + itemData.info.uses + ' uses left.</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "carkeys") {
            $(".item-info-title").html('<p>' + itemData.info.model + ' Car Key</p>')
            $(".item-info-description").html('<p>Model: ' + itemData.info.model + '</p><p>License Plate: ' + itemData.info.plate + '</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "carstashkey") {
            $(".item-info-title").html('<p>' + itemData.info.car + ' Stash Key</p>')
            $(".item-info-description").html('<p><strong></strong><span></span></p><p><strong>Owner: ' + itemData.info.owner + '</span></p><span><p><strong>Model: </strong><span>' + itemData.info.car + '</span></p><p><strong></strong><span></span></p><p><strong>License Plate: </strong><span>' + itemData.info.ss + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "arcadeblue") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Owner: </strong>' + itemData.info.owner + '</p><strong>Play Card Time:</strong> ' + itemData.info.cardtime + ' minutes</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "arcadegreen") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Owner: </strong>' + itemData.info.owner + '</p><strong>Play Card Time:</strong> ' + itemData.info.cardtime + ' minutes</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "arcadegold") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Owner: </strong>' + itemData.info.owner + '</p><strong>Play Card Time:</strong> ' + itemData.info.cardtime + ' minutes</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.type == "weapon") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
            if (itemData.info.ammo == undefined) {
                itemData.info.ammo = 0;
            } else {
                itemData.info.ammo != null ? itemData.info.ammo : 0;
            }
            if (itemData.info.attachments != null) {
                var attachmentString = "";
                $.each(itemData.info.attachments, function (i, attachment) {
                    if (i == itemData.info.attachments.length - 1) {
                        attachmentString += attachment.label;
                    } else {
                        attachmentString += attachment.label + ", ";
                    }
                });
                $(".item-info-description").html(
                    "<p><strong>ID: </strong><span>" +
                    itemData.info.serie +
                    "</span></p><p><strong>Munition: </strong><span>" +
                    itemData.info.ammo +
                    "</span></p><p><strong>Attachments: </strong><span>" +
                    attachmentString +
                    "</span></p>"
                );
            } else {
                $(".item-info-description").html(
                    "<p><strong>ID: </strong><span>" +
                    itemData.info.serie +
                    "</span></p><p><strong>Munition: </strong><span>" +
                    itemData.info.ammo +
                    "</span></p><p>" +
                    itemData.description +
                    "</p>"
                );
            }
        } else if (itemData.name == "filled_evidence_bag") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
            if (itemData.info.type == "casing") {
                $(".item-info-description").html('<p><strong>Evidence material: </strong><span>' + itemData.info.label + '</span></p><p><strong>Type number: </strong><span>' + itemData.info.ammotype + '</span></p><p><strong>Caliber: </strong><span>' + itemData.info.ammolabel + '</span></p><p><strong>ID: </strong><span>' + itemData.info.serie + '</span></p><p><strong>Crime scene: </strong><span>' + itemData.info.street + '</span></p><br /><p>' + itemData.description + '</p>');
            } else if (itemData.info.type == "blood") {
                $(".item-info-description").html('<p><strong>Evidence material: </strong><span>' + itemData.info.label + '</span></p><p><strong>Blood type: </strong><span>' + itemData.info.bloodtype + '</span></p><p><strong>DNA Code: </strong><span>' + itemData.info.dnalabel + '</span></p><p><strong>Crime scene: </strong><span>' + itemData.info.street + '</span></p><br /><p>' + itemData.description + '</p>');
            } else if (itemData.info.type == "fingerprint") {
                $(".item-info-description").html('<p><strong>Evidence material: </strong><span>' + itemData.info.label + '</span></p><p><strong>Vingerpatroon: </strong><span>' + itemData.info.fingerprint + '</span></p><p><strong>Plaats delict: </strong><span>' + itemData.info.street + '</span></p><br /><p>' + itemData.description + '</p>');
            } else if (itemData.info.type == "dna") {
                $(".item-info-description").html('<p><strong>Evidence material: </strong><span>' + itemData.info.label + '</span></p><p><strong>DNA Code: </strong><span>' + itemData.info.dnalabel + '</span></p><br /><p>' + itemData.description + '</p>');
            }
        } else if (itemData.name == "phone") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Owner: ' + itemData.info.firstname + ' ' + itemData.info.lastname + '<br>' + 'Number: ' + itemData.info.phone + '</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "visa" || itemData.name == "mastercard") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            var str = "" + itemData.info.cardNumber + "";
            var res = str.slice(12);
            var cardNumber = "************" + res;
            $(".item-info-description").html('<p><strong>Card Holder: </strong><span>' + itemData.info.name + '</span></p><p><strong>Citizen ID: </strong><span>' + itemData.info.citizenid + '</span></p><p><strong>Card Number: </strong><span>' + cardNumber + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.info.costs != undefined && itemData.info.costs != null) {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>' + itemData.info.costs + '</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "burger-ticket") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Paid: </strong><span>$' + itemData.info.price + '</span></p><p><strong>Note: </strong><span>' + itemData.info.note + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "note") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>' + itemData.info.label + '</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "moneybag") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Amount of cash: </strong><span><strong style="color: green;width: 100%;">$ </strong>' + itemData.info.cash + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "markedbills") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Worth: </strong><span><strong style="color: green;width: 100%;">$ </strong>' + itemData.info.worth + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "duffel-bag") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Duffel Bag ID: </strong><span>' + itemData.info.bagid + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "murder-meal") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p><strong>Murder Meal ID: </strong><span>' + itemData.info.mealid + '</span></p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "labkey") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Lab: ' + itemData.info.lab + '</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "bass") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "stingray") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "flounder") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "codfish") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "mackerel") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "dolphin") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "sharkhammer") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "sharktiger") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "killerwhale") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Species: ' + itemData.info.species + '</p>Weight: ' + itemData.info.lbs + ' lbs</p>Type: ' + itemData.info.type);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "fishicebox") {
            $(".item-info-title").html('<p>' + itemData.label + ' ' + itemData.info.boxid + '</p>')
            $(".item-info-description").html('<p><strong>Box Owner: </strong><span>' + itemData.info.boxOwner + '</span></p> Ice Box to store all of your fish');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_1oz_low") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_1oz_mid") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_1oz_high") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_3.5_low") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_3.5_mid") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "marijuana_3.5_high") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Strain: ' + itemData.info.strain + '</p>Potency: ' + itemData.info.potency + '</p>Type: ' + itemData.info.type + '<p>Thc: ' + itemData.info.thc + '%</p>');
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')

        } else if (itemData.name == "casino_member_validated") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Diamond Casino Member:  ' + itemData.info.owner);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        } else if (itemData.name == "casino_vip_validated") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>Diamond Casino V.I.P:  ' + itemData.info.owner);
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        }



        else {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            $(".item-info-description").html('<p>' + itemData.description + '</p>')
            $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')
        }
    } else {
        $(".item-info-title").html('<p>' + itemData.label + ' </p>')
        $(".item-info-description").html('<p>' + itemData.description + '</p>')
        $(".item-info-stats").html('<p>Weight: ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1) + ' | Amount: ' + itemData.amount + ' | Quality: ' + itemData.info.quality.toFixed(0) + '%</p>')

    }
}


function handleDragDrop() {
    $(".item-drag").draggable({
        helper: 'clone',
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function (event, ui) {
            IsDragging = true;

            //    $(this).css("background", "rgba(20,20,20,0.0)");
            //    $(".item-slot").css("border", "1px solid #191e2500")

            $(this).find("img").css("filter", "brightness(50%)");


            var itemData = $(this).data("item");
            var dragAmount = $("#item-amount").val();
            if (!itemData.useable) {
                // $("#item-use").css("background", "rgba(35,35,35, 0.0");
            }

            if (dragAmount == 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html('0x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0.0');
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html('(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html('0x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0.0');
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(itemData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1));
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else if (dragAmount > itemData.amount) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html('(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html(itemData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1));
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else if (dragAmount > 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html('(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html('(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html((itemData.amount - dragAmount) + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * (itemData.amount - dragAmount)) / 1000).toFixed(1));
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(dragAmount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * dragAmount) / 1000).toFixed(1));
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else if (itemData.quality < toData.info.quality) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html('(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html(itemData.amount + 'x ' + ((itemData.weight * itemData.amount) / 1000).toFixed(1));
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else {
                if ($(this).parent().attr("data-inventory") == "hotbar") {
                    // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                }
                $(".ui-draggable-dragging").find(".item-slot-key").remove();
                $(this).find(".item-slot-amount p").html(itemData.amount + ' (' + ((itemData.weight * itemData.amount) / 1000).toFixed(1));
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            }
        },
        stop: function () {
            setTimeout(function () {
                IsDragging = false;
            }, 300)

            // $(this).css("background", "#006aff05");
            // $(".item-slot").css("border", "1px solid #191e2510") 

            $(this).find("img").css("filter", "brightness(100%)");
            // $("#item-use").css("background", "rgba("+InventoryOption+", 0.0)");
        },
    });

    $(".item-slot").droppable({
        hoverClass: 'item-slot-hoverClass',
        drop: function (event, ui) {
            // $(".item-slot").css("border", "1px solid rgba(220, 240, 220, 0.05)")

            setTimeout(function () {
                IsDragging = false;
            }, 300)
            fromSlot = ui.draggable.attr("data-slot");
            fromInventory = ui.draggable.parent();
            toSlot = $(this).attr("data-slot");
            toInventory = $(this).parent();
            toAmount = $("#item-amount").val();

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }
            if (toAmount >= 0) {
                if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                    swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                }
            }
        },
    });

    $("#item-use").droppable({
        hoverClass: 'button-hover',
        drop: function (event, ui) {
            setTimeout(function () {
                IsDragging = false;
            }, 300)
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post("http://qb-inventory/UseItem", JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                }));
            }
        }
    });

    $("#item-give").droppable({
        hoverClass: "button-hover",
        drop: function (event, ui) {
            setTimeout(function () {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $.post(
                "https://qb-inventory/GiveItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
            Inventory.Close();
        },
    });

    $("#item-drop").droppable({
        hoverClass: 'item-slot-hoverClass',
        drop: function (event, ui) {
            setTimeout(function () {
                IsDragging = false;
            }, 300)
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) { amount = fromData.amount }
            // $(this).css("background", "rgba(35,35,35, 0.7");
            $.post("http://qb-inventory/DropItem", JSON.stringify({
                inventory: fromInventory,
                item: fromData,
                amount: parseInt(amount),
            }));
        }
    })
}

function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }

    if (($fromInv.attr("data-inventory") == "hotbar" && $toInv.attr("data-inventory") == "player") || ($fromInv.attr("data-inventory") == "player" && $toInv.attr("data-inventory") == "hotbar") || ($fromInv.attr("data-inventory") == "player" && $toInv.attr("data-inventory") == "player") || ($fromInv.attr("data-inventory") == "hotbar" && $toInv.attr("data-inventory") == "hotbar")) {
        return true;
    }

    if (($fromInv.attr("data-inventory").split("-")[0] == "itemshop" && $toInv.attr("data-inventory").split("-")[0] == "itemshop") || ($fromInv.attr("data-inventory") == "crafting" && $toInv.attr("data-inventory") == "crafting")) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');
        } else {
            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>' + itemData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * itemData.amount) / 1000).toFixed(2) + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');

        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($toAmount == 0 && ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" || $fromInv.attr("data-inventory") == "crafting")) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');
        } else {
            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>' + itemData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * itemData.amount) / 1000).toFixed(2) + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($toInv.attr("data-inventory").split("-")[0] == "itemshop" || $toInv.attr("data-inventory") == "crafting") {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>(' + itemData.amount + ') <strong style="color: green;width: 100%;">$ </strong>' + itemData.price + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');
        } else {
            $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + itemData.image + '" alt="' + itemData.name + '" /></div><div class="item-slot-amount"><p>' + itemData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((itemData.weight * itemData.amount) / 1000).toFixed(2) + '</p></div><div class="item-slot-label"><p>' + itemData.label + '</p></div>');
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) { $toAmount = fromData.amount }
        if (toData == null || fromData.name == toData.name) {
            if ($fromInv.attr("data-inventory") == "player" || $fromInv.attr("data-inventory") == "hotbar") {
                totalWeight = totalWeight - (fromData.weight * $toAmount);
                totalWeightOther = totalWeightOther + (fromData.weight * $toAmount);
            } else {
                totalWeight = totalWeight + (fromData.weight * $toAmount);
                totalWeightOther = totalWeightOther - (fromData.weight * $toAmount);
            }
        } else {
            if ($fromInv.attr("data-inventory") == "player" || $fromInv.attr("data-inventory") == "hotbar") {
                totalWeight = totalWeight - (fromData.weight * $toAmount);
                totalWeight = totalWeight + (toData.weight * toData.amount)

                totalWeightOther = totalWeightOther + (fromData.weight * $toAmount);
                totalWeightOther = totalWeightOther - (toData.weight * toData.amount);
            } else {
                totalWeight = totalWeight + (fromData.weight * $toAmount);
                totalWeight = totalWeight - (toData.weight * toData.amount)

                totalWeightOther = totalWeightOther - (fromData.weight * $toAmount);
                totalWeightOther = totalWeightOther + (toData.weight * toData.amount);
            }
        }
    }

    if (totalWeight > playerMaxWeight || (totalWeightOther > otherMaxWeight && $fromInv.attr("data-inventory").split("-")[0] != "itemshop" && $fromInv.attr("data-inventory") != "crafting")) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    var per3 = (totalWeight / 1000) / (playerMaxWeight / 100000)
    $(".progress-player").css("width", per3 + "%");
    $("#player-inv-weight").html('<div style="position:relative;color:white;font-size: 15px;"> </div>' + (parseInt(totalWeight) / 1000) + "/" + (playerMaxWeight / 1000));

    if ($fromInv.attr("data-inventory").split("-")[0] != "itemshop" && $toInv.attr("data-inventory").split("-")[0] != "itemshop" && $fromInv.attr("data-inventory") != "crafting" && $toInv.attr("data-inventory") != "crafting") {
        $("#other-inv-label").html(otherLabel)
        $("#other-inv-weight").html("" + (parseInt(totalWeightOther) / 1000) + " / " + (otherMaxWeight / 1000))

        var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
        $(".progress-other").css("width", per1 + "%");
    }

    return true;
}

var combineslotData = null;

$(document).on('click', '.CombineItem', function (e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post('http://qb-inventory/combineWithAnim', JSON.stringify({
            combineData: combineslotData.toData.combinable,
            usedItem: combineslotData.toData.name,
            requiredItem: combineslotData.fromData.name
        }))
    } else {
        $.post('http://qb-inventory/combineItem', JSON.stringify({
            reward: combineslotData.toData.combinable.reward,
            toItem: combineslotData.toData.name,
            fromItem: combineslotData.fromData.name
        }))
    }
    Inventory.Close();
});

$(document).on('click', '.SwitchItem', function (e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(combineslotData.fromSlot, combineslotData.toSlot, combineslotData.fromInv, combineslotData.toInv, combineslotData.toAmount, combineslotData.toData, combineslotData.fromData)
});

function optionSwitch($fromSlot, $toSlot, $fromInv, $toInv, $toAmount, toData, fromData) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");


    if ($toSlot < 6) {
        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>' + $toSlot + '</p></div><div class="item-slot-img"><img src="images/' + fromData.image + '" alt="' + fromData.name + '" /></div><div class="item-slot-amount"><p>' + fromData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((fromData.weight * fromData.amount) / 1000).toFixed(2) + '</p></div><div class="item-slot-label"><p>' + fromData.label + '</p></div>');
    } else {
        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + fromData.image + '" alt="' + fromData.name + '" /></div><div class="item-slot-amount"><p>' + fromData.amount + ' (' + ((fromData.weight * fromData.amount) / 1000).toFixed(2) + ')</p></div><div class="item-slot-label"><p>' + fromData.label + '</p></div>');
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 6) {
        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>' + $fromSlot + '</p></div><div class="item-slot-img"><img src="images/' + toData.image + '" alt="' + toData.name + '" /></div><div class="item-slot-amount"><p>' + toData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((toData.weight * toData.amount) / 1000).toFixed(2) + '</p></div><div class="item-slot-label"><p>' + toData.label + '</p></div>');
    } else {
        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + toData.image + '" alt="' + toData.name + '" /></div><div class="item-slot-amount"><p>' + toData.amount + ' (' + ((toData.weight * toData.amount) / 1000).toFixed(2) + ')</p></div><div class="item-slot-label"><p>' + toData.label + '</p></div>');
    }

    $.post("http://qb-inventory/SetInventoryData", JSON.stringify({
        fromInventory: $fromInv.attr("data-inventory"),
        toInventory: $toInv.attr("data-inventory"),
        fromSlot: $fromSlot,
        toSlot: $toSlot,
        fromAmount: $toAmount,
        toAmount: toData.amount,
    }));
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount, $toData) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData.info.expire != null) {
        const ConvertTime = 60 * 24 * fromData.info.expire;
        const Time = 60 * ConvertTime;
        let StartDate = new Date(fromData.info.date).getTime()
        fromData.info.quality = (100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)).toFixed(0)
    }

    if (toData != undefined) {
        if (toData.info.expire != null) {
            const ConvertTime = 60 * 24 * toData.info.expire;
            const Time = 60 * ConvertTime;
            let StartDate = new Date(toData.info.date).getTime()
            toData.info.quality = (100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)).toFixed(0)
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (($fromInv.attr("data-inventory") == "player" || $fromInv.attr("data-inventory") == "hotbar") && $toInv.attr("data-inventory").split("-")[0] == "itemshop" && $toInv.attr("data-inventory") == "crafting") {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if ($toAmount == 0 && $fromInv.attr("data-inventory").split("-")[0] == "itemshop" && $fromInv.attr("data-inventory") == "crafting") {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount
        }

        if ((toData != undefined || toData != null) && toData.name == fromData.name && !fromData.unique) {
            if (fromData.info.quality == toData.info.quality) {
                var newData = [];
                newData.name = toData.name;
                newData.label = toData.label;
                newData.amount = (parseInt($toAmount) + parseInt(toData.amount));
                newData.type = toData.type;
                newData.description = toData.description;
                newData.image = toData.image;
                newData.weight = toData.weight;
                newData.info = toData.info;
                newData.useable = toData.useable;
                newData.unique = toData.unique;
                newData.quality = toData.quality;
                newData.slot = parseInt($toSlot);
                newData.info.quality = toData.info.quality;

                if (fromData.amount == $toAmount) {
                    $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                    var ItemLabel = '<div class="item-slot-label"><p>' + newData.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + newData.info.quality + '</p> </div></div>';
                    if (newData.info.quality == 100) {
                        qualityLabel = "";
                    }


                    if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>' + $toSlot + '</p></div><div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newData.weight * newData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + "x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + ((newData.weight * newData.amount) / 1000).toFixed(1) + "</p></div>" + ItemLabel);
                    } else {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newData.weight * newData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    }

                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        if (newData.info.expire != null) {
                            const ConvertTime = 60 * 24 * newData.info.expire;
                            const Time = 60 * ConvertTime;
                            let StartDate = new Date(newData.info.date).getTime()
                            newData.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        }
                        qualityLabel = ""
                        if (newData.info.quality == undefined) { newData.info.quality = 100.0; }
                        var QualityColor = "rgb(0, 228, 174)";
                        if (newData.info.quality < 26) {
                            QualityColor = "rgb(13, 147, 131)";
                        } else if (newData.info.quality > 25 && newData.info.quality < 51) {
                            QualityColor = "rgb(7, 190, 155)";
                        } else if (newData.info.quality >= 50) {
                            QualityColor = "rgb(0, 228, 174)";
                        }
                        if (newData.info.quality !== undefined) {
                            if (newData.info.expire !== undefined) {
                                qualityLabel = (newData.info.quality).toFixed();

                            } else {
                                qualityLabel = (newData.info.quality);
                            }
                        } else {
                            qualityLabel = (newData.info.quality);
                        }
                        if (newData.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality <= 0.0) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality > 0 && newData.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality > 5 && newData.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        $toInv.find("[data-slot=" + $toSlot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                    $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>');
                } else if (fromData.amount > $toAmount) {
                    var newDataFrom = [];
                    newDataFrom.name = fromData.name;
                    newDataFrom.label = fromData.label;
                    newDataFrom.amount = parseInt((fromData.amount - $toAmount));
                    newDataFrom.type = fromData.type;
                    newDataFrom.description = fromData.description;
                    newDataFrom.image = fromData.image;
                    newDataFrom.weight = fromData.weight;
                    newDataFrom.price = fromData.price;
                    newDataFrom.info = fromData.info;
                    newDataFrom.useable = fromData.useable;
                    newDataFrom.unique = fromData.unique;
                    newDataFrom.slot = parseInt($fromSlot);
                    newDataFrom.info.quality = fromData.info.quality;

                    $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                    var ItemLabel = '<div class="item-slot-label"><p>' + newData.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + newData.info.quality + '</p> </div></div>';

                    if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>' + $toSlot + '</p></div><div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newData.weight * newData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + "x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + ((newData.weight * newData.amount) / 1000).toFixed(1) + "</p></div>" + ItemLabel);
                    } else {
                        $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + newData.image + '" alt="' + newData.name + '" /></div><div class="item-slot-amount"><p>' + newData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newData.weight * newData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    }


                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        if (newData.info.expire != null) {
                            const ConvertTime = 60 * 24 * newData.info.expire;
                            const Time = 60 * ConvertTime;
                            let StartDate = new Date(newData.info.date).getTime()
                            newData.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        }
                        if (newData.info.quality == undefined) { newData.info.quality = 100.0; }
                        var QualityColor = "rgb(0, 228, 174)";
                        if (newData.info.quality < 26) {
                            QualityColor = "rgb(13, 147, 131)";
                        } else if (newData.info.quality > 25 && newData.info.quality < 51) {
                            QualityColor = "rgb(7, 190, 155)";
                        } else if (newData.info.quality >= 50) {
                            QualityColor = "rgb(0, 228, 174)";
                        }
                        if (newData.info.quality !== undefined) {
                            if (newData.info.expire !== undefined) {
                                qualityLabel = (newData.info.quality).toFixed();
                            } else {
                                qualityLabel = (newData.info.quality).toFixed();
                            }
                        } else {
                            qualityLabel = "";
                        }
                        if (newData.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality == 0) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (newData.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        $toInv.find("[data-slot=" + $toSlot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", newDataFrom);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

                    if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>(' + newDataFrom.amount + ') <strong style="color: green;width: 100%;">$ </strong> ' + newDataFrom.price + '</p></div><div class="item-slot-label"><p>' + newDataFrom.label + '</p><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + fromData.info.quality + '</p> </div></div>');
                    } else {
                        var ItemLabel = '<div class="item-slot-label"><p>' + fromData.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + fromData.info.quality + '</p> </div></div>';

                        if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>' + $fromSlot + '</p></div><div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>' + newDataFrom.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                        } else if (
                            $fromSlot == 41 &&
                            $fromInv.attr("data-inventory") == "player"
                        ) {
                            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>' + newDataFrom.amount + "x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(1) + "</p></div>" + ItemLabel);
                        } else {
                            $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>' + newDataFrom.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                        }


                        if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            if (newDataFrom.info.expire != null) {
                                const ConvertTime = 60 * 24 * newDataFrom.info.expire;
                                const Time = 60 * ConvertTime;
                                let StartDate = new Date(newDataFrom.info.date).getTime()
                                newDataFrom.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                                qualityLabel = (newDataFrom.info.quality).toFixed();
                            }
                            if (newDataFrom.info.quality == undefined) { newDataFrom.info.quality = 100.0; }
                            var QualityColor = "rgb(0, 228, 174)";
                            if (newDataFrom.info.quality < 26) {
                                QualityColor = "rgb(13, 147, 131)";
                            } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 51) {
                                QualityColor = "rgb(7, 190, 155)";
                            } else if (newDataFrom.info.quality >= 50) {
                                QualityColor = "rgb(0, 228, 174)";
                            }
                            if (newDataFrom.info.quality !== undefined) {
                                if (newDataFrom.info.expire !== undefined) {
                                    qualityLabel = (newDataFrom.info.quality).toFixed();

                                } else {
                                    qualityLabel = (newDataFrom.info.quality).toFixed();
                                }
                            } else {
                                qualityLabel = "";
                            }
                            if (newDataFrom.info.quality >= 98.0) {
                                qualityLabel = "";
                            }
                            if (newDataFrom.info.quality <= 0.0) {
                                qualityLabel = "";
                            }
                            if (newDataFrom.info.quality > 0 && newDataFrom.info.quality <= 5) {
                                qualityLabel = "";
                            }
                            if (newDataFrom.info.quality > 5 && newDataFrom.info.quality <= 10) {
                                qualityLabel = "";
                            }
                            $fromInv.find("[data-slot=" + $fromSlot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }

                    }
                }
                $.post("http://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post("http://qb-inventory/SetInventoryData", JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                }));
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        } else {
            if (fromData.amount == $toAmount) {
                if (toData != undefined && toData.combinable != null && isItemAllowed(fromData.name, toData.combinable.accept)) {
                    $.post('http://qb-inventory/getCombineItem', JSON.stringify({ item: toData.combinable.reward }), function (item) {
                        $('.combine-option-text').html("<p>If you combine this item you get: <b>" + item.label + "</b></p>");
                    })
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = []
                    combineslotData.fromData = fromData
                    combineslotData.toData = toData
                    combineslotData.fromSlot = $fromSlot
                    combineslotData.toSlot = $toSlot
                    combineslotData.fromInv = $fromInv
                    combineslotData.toInv = $toInv
                    combineslotData.toAmount = $toAmount
                    return
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel = '<div class="item-slot-label"><p>' + fromData.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + fromData.info.quality + '</p> </div></div>';

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>' + $toSlot + '</p></div><div class="item-slot-img"><img src="images/' + fromData.image + '" alt="' + fromData.name + '" /></div><div class="item-slot-amount"><p>' + fromData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((fromData.weight * fromData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            " (" +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            ")</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + fromData.image + '" alt="' + fromData.name + '" /></div><div class="item-slot-amount"><p>' + fromData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((fromData.weight * fromData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                }

                if (!Inventory.IsWeaponBlocked(fromData.name)) {
                    if (fromData.info.expire != null) {
                        const ConvertTime = 60 * 24 * fromData.info.expire;
                        const Time = 60 * ConvertTime;
                        let StartDate = new Date(fromData.info.date).getTime()
                        fromData.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                    }
                    if (fromData.info.quality == undefined) { fromData.info.quality = 100.0; }
                    var QualityColor = "rgb(0, 228, 174)";
                    if (fromData.info.quality < 26) {
                        QualityColor = "rgb(13, 147, 131)";
                    } else if (fromData.info.quality > 25 && fromData.info.quality < 51) {
                        QualityColor = "rgb(7, 190, 155)";
                    } else if (fromData.info.quality >= 50) {
                        QualityColor = "rgb(0, 228, 174)";
                    }
                    if (fromData.info.quality !== undefined) {
                        if (fromData.info.expire !== undefined) {
                            qualityLabel = (fromData.info.quality).toFixed();

                        } else {
                            qualityLabel = (fromData.info.quality).toFixed();
                        }
                    } else {
                        qualityLabel = "";
                    }
                    if (fromData.info.quality >= 98.0) {
                        qualityLabel = "";
                    }
                    if (fromData.info.quality <= 0.0) {
                        qualityLabel = "";
                    }
                    if (fromData.info.quality > 0 && fromData.info.quality <= 5) {
                        qualityLabel = "";
                    }
                    if (fromData.info.quality > 5 && fromData.info.quality <= 10) {
                        qualityLabel = "";
                    }
                    $toInv.find("[data-slot=" + $toSlot + "]").find(".item-slot-quality-bar").css({
                        "width": qualityLabel,
                        "background-color": QualityColor
                    }).find('p').html(qualityLabel);
                }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel = '<div class="item-slot-label"><p>' + toData.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + toData.info.quality + '</p> </div></div>';
                    if (toData.info.quality == 100) {
                        qualityLabel = "";
                    }


                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>' + $fromSlot + '</p></div><div class="item-slot-img"><img src="images/' + toData.image + '" alt="' + toData.name + '" /></div><div class="item-slot-amount"><p>' + toData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((toData.weight * toData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                " (" +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                ")</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + toData.image + '" alt="' + toData.name + '" /></div><div class="item-slot-amount"><p>' + toData.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((toData.weight * toData.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    }


                    if (!Inventory.IsWeaponBlocked(toData.name)) {
                        if (toData.info.expire != null) {
                            const ConvertTime = 60 * 24 * toData.info.expire;
                            const Time = 60 * ConvertTime;
                            let StartDate = new Date(toData.info.date).getTime()
                            toData.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        }
                        if (toData.info.quality == undefined) { toData.info.quality = 100.0; }
                        var QualityColor = "rgb(0, 228, 174)";
                        if (toData.info.quality < 26) {
                            QualityColor = "rgb(13, 147, 131)";
                        } else if (toData.info.quality > 25 && toData.info.quality < 51) {
                            QualityColor = "rgb(7, 190, 155)";
                        } else if (toData.info.quality >= 50) {
                            QualityColor = "rgb(0, 228, 174)";
                        }
                        if (toData.info.quality !== undefined) {
                            if (toData.info.expire !== undefined) {
                                qualityLabel = (toData.info.quality).toFixed();

                            } else {
                                qualityLabel = (toData.info.quality).toFixed();
                            }
                        } else {
                            qualityLabel = "";
                        }
                        if (toData.info.quality <= 0.0) {
                            qualityLabel = "";
                        }
                        if (toData.info.quality > 0 && toData.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (toData.info.quality > 5 && toData.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        if (toData.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        $fromInv.find("[data-slot=" + $fromSlot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }


                    $.post("http://qb-inventory/SetInventoryData", JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        toData: $toData,
                        fromAmount: $toAmount,
                        toAmount: toData.amount,
                    }));
                } else {
                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>' + $fromSlot + '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>');
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>');
                    }

                    $.post("http://qb-inventory/SetInventoryData", JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        toData: $toData,
                        fromAmount: $toAmount,
                    }));
                }
                $.post("http://qb-inventory/PlayDropSound", JSON.stringify({}));
            } else if (fromData.amount > $toAmount && (toData == undefined || toData == null)) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);
                newDataTo.info.quality = fromData.info.quality;

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel = '<div class="item-slot-label"><p>' + newDataTo.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + newDataTo.info.quality + '</p> </div></div>';

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-key"><p>' + $toSlot + '</p></div><div class="item-slot-img"><img src="images/' + newDataTo.image + '" alt="' + newDataTo.name + '" /></div><div class="item-slot-amount"><p>' + newDataTo.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            " (" +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            ")</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv.find("[data-slot=" + $toSlot + "]").html('<div class="item-slot-img"><img src="images/' + newDataTo.image + '" alt="' + newDataTo.name + '" /></div><div class="item-slot-amount"><p>' + newDataTo.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                }

                if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                    if (newDataTo.info.expire != null) {
                        const ConvertTime = 60 * 24 * newDataTo.info.expire;
                        const Time = 60 * ConvertTime;
                        let StartDate = new Date(newDataTo.info.date).getTime()
                        newDataTo.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                    }
                    if (newDataTo.info.quality == undefined) {
                        newDataTo.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(0, 228, 174)";
                    if (newDataTo.info.quality < 26) {
                        QualityColor = "rgb(13, 147, 131)";
                    } else if (newDataTo.info.quality > 25 && newDataTo.info.quality < 51) {
                        QualityColor = "rgb(7, 190, 155)";
                    } else if (newDataTo.info.quality >= 50) {
                        QualityColor = "rgb(0, 228, 174)";
                    }
                    if (newDataTo.info.quality !== undefined) {
                        if (newDataTo.info.expire !== undefined) {
                            qualityLabel = (newDataTo.info.quality).toFixed();
                        } else {
                            qualityLabel = (newDataTo.info.quality).toFixed();
                        }
                    } else {
                        qualityLabel = "";
                    }
                    if (newDataTo.info.quality >= 98.0) {
                        qualityLabel = "";
                    }
                    if (newDataTo.info.quality <= 0.0) {
                        qualityLabel = "";
                    }
                    if (newDataTo.info.quality > 0 && newDataTo.info.quality <= 5) {
                        qualityLabel = "";
                    }
                    if (newDataTo.info.quality > 5 && newDataTo.info.quality <= 10) {
                        qualityLabel = "";
                    }
                    $toInv.find("[data-slot=" + $toSlot + "]").find(".item-slot-quality-bar").css({
                        "width": qualityLabel,
                        "background-color": QualityColor
                    }).find('p').html(qualityLabel);
                }


                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt((fromData.amount - $toAmount));
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);
                newDataFrom.info.quality = fromData.info.quality;

                $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>(' + newDataFrom.amount + ') <strong style="color: green;width: 100%;">$ </strong> ' + newDataFrom.price + '</p></div><div class="item-slot-label"><p>' + newDataFrom.label + '</p></div>');
                } else {

                    var ItemLabel = '<div class="item-slot-label"><p>' + newDataFrom.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + newDataFrom.info.quality + '</p> </div></div>';

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-key"><p>' + $fromSlot + '</p></div><div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>' + newDataFrom.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                " (" +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                ")</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv.find("[data-slot=" + $fromSlot + "]").html('<div class="item-slot-img"><img src="images/' + newDataFrom.image + '" alt="' + newDataFrom.name + '" /></div><div class="item-slot-amount"><p>' + newDataFrom.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    }

                    if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                        if (newDataFrom.info.expire != null) {
                            const ConvertTime = 60 * 24 * newDataFrom.info.expire;
                            const Time = 60 * ConvertTime;
                            let StartDate = new Date(newDataFrom.info.date).getTime()
                            newDataFrom.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        }
                        if (newDataFrom.info.quality == undefined) { newDataFrom.info.quality = 100.0; }
                        var QualityColor = "rgb(0, 228, 174)";
                        if (newDataFrom.info.quality < 26) {
                            QualityColor = "rgb(13, 147, 131)";
                        } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 51) {
                            QualityColor = "rgb(7, 190, 155)";
                        } else if (newDataFrom.info.quality >= 50) {
                            QualityColor = "rgb(0, 228, 174)";
                        }
                        if (newDataFrom.info.quality !== undefined) {
                            if (newDataFrom.info.expire !== undefined) {
                                qualityLabel = (newDataFrom.info.quality).toFixed();
                            }
                        } else {
                            qualityLabel = "";
                        }
                        if (newDataFrom.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (newDataFrom.info.quality <= 0.0) {
                            qualityLabel = "";
                        }
                        if (newDataFrom.info.quality > 0 && newDataFrom.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (newDataFrom.info.quality > 5 && newDataFrom.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        $fromInv.find("[data-slot=" + $fromSlot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                }
                $.post("http://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post("http://qb-inventory/SetInventoryData", JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                }));
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
        InventoryError($fromInv, $fromSlot);
    }
    handleDragDrop();
}

function isItemAllowed(item, allowedItems) {
    var retval = false
    $.each(allowedItems, function (index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval
}

function InventoryError($elinv, $elslot) {
    $elinv.find("[data-slot=" + $elslot + "]").css("background", "rgba(156, 20, 20, 0.5)").css("transition", "background 500ms");
    setTimeout(function () {
        $elinv.find("[data-slot=" + $elslot + "]").css("background", "rgba(255, 255, 255, 0.03)");
    }, 500)
    $.post("http://qb-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 30;
    Inventory.droplabel = "Ground";
    Inventory.dropmaxweight = 1000000

    Inventory.Error = function () {
        $.post("http://qb-inventory/PlayDropFail", JSON.stringify({}));
    }

    Inventory.IsWeaponBlocked = function (WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed"
        ]

        var retval = false;
        $.each(DurabilityBlockedWeapons, function (i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    }

    Inventory.QualityCheck = function (item, IsHotbar, IsOtherInventory) {
        if (!Inventory.IsWeaponBlocked(item.name)) {
            if (item != null) {
                if (item.info.expire != null) {
                    const ConvertTime = 60 * 24 * item.info.expire;
                    const Time = 60 * ConvertTime;
                    let StartDate = new Date(item.info.date).getTime()
                    item.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                }
                qualityLabel = "";
                if (item.info.quality == undefined) { item.info.quality = 100; }
                var QualityColor = "rgb(0, 228, 174)";
                if (item.info.quality < 26) {
                    QualityColor = "rgb(13, 147, 131)";
                } else if (item.info.quality > 25 && item.info.quality < 51) {
                    QualityColor = "rgb(7, 190, 155)";
                } else if (item.info.quality >= 50) {
                    QualityColor = "rgb(0, 228, 174)";
                }
                if (item.info.quality >= 98.0) {
                    qualityLabel = "";
                }
                if (item.info.quality <= 0.0) {
                    item.info.quality = 0;
                    qualityLabel = "";
                }
                if (item.info.quality > 0 && item.info.quality <= 5) {
                    qualityLabel = "";
                }
                if (item.info.quality > 5 && item.info.quality <= 10) {
                    qualityLabel = "";
                }
                if (item.info.quality !== undefined) {
                    qualityLabel = (item.info.quality).toFixed();
                } else {
                    qualityLabel = (item.info.quality);
                }
                if (item.info.quality <= 0) {
                    qualityLabel = "";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                }
                if (item.info.quality > 0 && item.info.quality <= 5) {
                    qualityLabel = "";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                }
                if (item.info.quality > 5 && item.info.quality <= 10) {
                    qualityLabel = "";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                } else {
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                }
                if (item.info.quality >= 98.0) {
                    qualityLabel = "";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": "100%",
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                } else {
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory").find("[data-zhotbarslot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                                "width": qualityLabel,
                                "background-color": QualityColor
                            }).find('p').html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").find(".item-slot-quality-bar").css({
                            "width": qualityLabel,
                            "background-color": QualityColor
                        }).find('p').html(qualityLabel);
                    }
                }
            }
        }
    }

    Inventory.Open = function (data) {


        totalWeight = 0;
        totalWeightOther = 0;

        $("#player-inv-label").html('Player')
        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        $(".ply-iteminfo-container").css("opacity", "0.0");


        if (requiredItemOpen) {
            $(".requiredItem-container").hide();
            requiredItemOpen = false;
        }

        $("#qbus-inventory").fadeIn(300);
        if (data.other != null && data.other != "") {
            $(".other-inventory").attr("data-inventory", data.other.name);
        } else {
            $(".other-inventory").attr("data-inventory", 0);
        }
        // First 5 Slots
        for (i = 1; i < 6; i++) {
            $(".player-inventory").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        // Inventory
        for (i = 6; i < data.slots + 1; i++) {
            if (i == 41) {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }



        if (data.other != null && data.other != "") {
            for (i = 1; i < (data.other.slots + 1); i++) {
                $(".other-inventory").append('<div class="item-slot" data-slot="' + i + '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>');
            }
        } else {
            for (i = 1; i < (Inventory.dropslots + 1); i++) {
                $(".other-inventory").append('<div class="item-slot" data-slot="' + i + '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>');
            }
            $(".other-inventory .item-slot").css({
                "background-color": "rgba(255, 255, 255, 0.05)"
            });
        }

        if (data.inventory !== null) {
            $.each(data.inventory, function (i, item) {
                if (item != null) {
                    totalWeight += (item.weight * item.amount);
                    qualityLabel = "";
                    var ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p></div></div>';

                    // if (item.info.quality != null) {
                    //     qualityLabel = item.info.quality;
                    // }

                    if (item.info.expire != null) {
                        const ConvertTime = 60 * 24 * item.info.expire;
                        const Time = 60 * ConvertTime;
                        let StartDate = new Date(item.info.date).getTime()
                        item.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        if (item.info.quality == null) {
                            item.info.quality = 100;
                            qualityLabel = "";
                        }
                        if (item.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (item.info.quality <= 0.0) {
                            item.info.quality = 0;
                            qualityLabel = "";
                        }
                        if (item.info.quality > 0 && item.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (item.info.quality > 5 && item.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p> </div></div>';
                        TimeDurability = item.info.quality
                        QualityData = item;
                    }


                    $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);

                    if (item.slot < 6) {
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-key"><p>' + item.slot + '</p></div><div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                    } else if (item.slot == 41) {
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + "x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + ((item.weight * item.amount) / 1000).toFixed(1) + "</p></div>" + ItemLabel);
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                    } else {
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                        $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if ((data.other != null && data.other != "") && data.other.inventory != null) {
            $.each(data.other.inventory, function (i, item) {
                if (item != null) {
                    totalWeightOther += (item.weight * item.amount);
                    qualityLabel = "";
                    var ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p></div></div>';

                    if (item.info.expire != null) {
                        const ConvertTime = 60 * 24 * item.info.expire;
                        const Time = 60 * ConvertTime;
                        let StartDate = new Date(item.info.date).getTime()
                        item.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        if (item.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (item.info.quality <= 0.0) {
                            item.info.quality = 0;
                            qualityLabel = "";
                        }
                        if (item.info.quality > 0 && item.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (item.info.quality > 5 && item.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p> </div></div>';
                        TimeDurability = item.info.quality
                        QualityData = item;
                    }


                    $(".other-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                    if (item.price != null) {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>(' + item.amount + ') <strong style="color: green;width: 100%;">$ </strong> ' + item.price + '</p></div>' + ItemLabel);
                    } else {
                        $(".other-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div>' + ItemLabel);
                    }
                    $(".other-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        var per3 = (totalWeight / 1000) / (data.maxweight / 100000)
        $(".progress-player").css("width", per3 + "%");
        // $("#player-inv-weight").html("" + (totalWeight / 1000).toFixed(2) + " / " + (data.maxweight / 1000).toFixed(2));
        $("#player-inv-weight").html('<div style="position:relative;color:white;font-size: 15px;"> </div>' + (totalWeight / 1000) + "/" + (data.maxweight / 1000));

        playerMaxWeight = data.maxweight;
        if (data.other != null) {
            var name = data.other.name.toString()
            if (name != null && (name.split("-")[0] == "itemshop" || name == "crafting")) {
                $("#other-inv-label").html(data.other.label);
            } else {
                $("#other-inv-label").html(data.other.label)
                $("#other-inv-weight").html('<div style="position:relative;color:white;font-size: 15px;"> </div>' + (totalWeightOther / 1000) + "/" + (data.other.maxweight / 1000))
                var per12 = (totalWeightOther / 1000) / (data.other.maxweight / 100000)
                $(".progress-other").css("width", per12 + "%");
            }
            otherMaxWeight = data.other.maxweight;
            otherLabel = data.other.label;
        } else {
            $("#other-inv-label").html(Inventory.droplabel)
            $("#other-inv-weight").html('<div style="position:relative;color:white;font-size: 15px;"> </div>' + (totalWeightOther / 1000) + "/" + (Inventory.dropmaxweight / 1000))
            var per123 = (totalWeightOther / 1000) / (Inventory.dropmaxweight / 100000)
            $(".progress-other").css("width", per123 + "%");
            otherMaxWeight = Inventory.dropmaxweight;
            otherLabel = Inventory.droplabel;
        }

        $.each(data.maxammo, function (index, ammotype) {
            $("#" + index + "_ammo").find('.ammo-box-amount').css({ "height": "0%" });
        });

        if (data.Ammo !== null) {
            $.each(data.Ammo, function (i, amount) {
                var Handler = i.split("_");
                var Type = Handler[1].toLowerCase();
                if (amount > data.maxammo[Type]) {
                    amount = data.maxammo[Type]
                }
                var Percentage = (amount / data.maxammo[Type] * 100)

                $("#" + Type + "_ammo").find('.ammo-box-amount').css({ "height": Percentage + "%" });
                $("#" + Type + "_ammo").find('span').html(amount + "x");
            });
        }

        handleDragDrop();
    };

    Inventory.Close = function () {


        $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");
        $(".ply-hotbar-inventory").css("display", "block");
        // $(".ply-iteminfo-container").css("display", "none");
        $(".ply-iteminfo-container").css("opacity", "0.0");
        $("#qbus-inventory").fadeOut(300);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        // if ($("#rob-money").length) {
        //     $("#rob-money").remove();
        // }

        $.post("http://qb-inventory/CloseInventory", JSON.stringify({}));

        if (AttachmentScreenActive) {
            $("#qbus-inventory").css({ "left": "0vw" });
            $(".weapon-attachments-container").css({ "left": "-100vw" });
            AttachmentScreenActive = false;
        }

        if (ClickedItemData !== null) {
            $("#weapon-attachments").fadeOut(250, function () {
                $("#weapon-attachments").remove();
                ClickedItemData = {};
            });
        }
    };

    Inventory.Update = function (data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }

        for (i = 1; i < data.slots + 1; i++) {
            if (i == 41) {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }


        $.each(data.inventory, function (i, item) {
            var ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p></div></div>';

            if (item.info.expire != null) {
                const ConvertTime = 60 * 24 * item.info.expire;
                const Time = 60 * ConvertTime;
                qualityLabel = "";
                let StartDate = new Date(item.info.date).getTime()
                item.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                if (item.info.quality >= 98.0) {
                    qualityLabel = "";
                }
                if (item.info.quality <= 0.0) {
                    item.info.quality = 0;
                    qualityLabel = "";
                }
                if (item.info.quality > 0 && item.info.quality <= 5) {
                    qualityLabel = "";
                }
                if (item.info.quality > 5 && item.info.quality <= 10) {
                    qualityLabel = "";
                }
                if (item.info.quality !== undefined) {
                    qualityLabel = (item.info.quality).toFixed();
                } else {
                    qualityLabel = (item.info.quality);
                }
                ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>' + qualityLabel + '</p> </div></div>';
                TimeDurability = item.info.quality
                QualityData = item;
            }


            if (item != null) {
                totalWeight += (item.weight * item.amount);

                $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);

                if (item.slot < 6) {
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-key"><p>' + item.slot + '</p></div><div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div><div class="item-slot-label"><p>' + item.label + '</p></div>');
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                } else if (item.slot == 41) {
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + "x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div><div class="item-slot-label"><p>' + item.label + "</p></div>");
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                } else {
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").addClass("item-drag");
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").html('<div class="item-slot-img"><img src="images/' + item.image + '" alt="' + item.name + '" /></div><div class="item-slot-amount"><p>' + item.amount + 'x &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ' + ((item.weight * item.amount) / 1000).toFixed(1) + '</p></div><div class="item-slot-label"><p>' + item.label + '</p></div>');
                    $(".player-inventory").find("[data-slot=" + item.slot + "]").data("item", item);
                }
            }
        });


        var per2 = (totalWeight / 1000) / (data.maxweight / 100000)
        $(".progress-player").css("width", per2 + "%");
        $("#player-inv-weight").html('<div style="position:relative;color:white;font-size: 15px;"> </div>' + (totalWeight / 1000) + "/" + (data.maxweight / 1000));


        handleDragDrop();
    };

    Inventory.ToggleHotbar = function (data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 6; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
                $(".z-hotbar-inventory").append(elem);
            }
            var elem =
                '<div class="z-hotbar-item-slot" data-zhotbarslot="41"> <div class="z-hotbar-item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            $(".z-hotbar-inventory").append(elem);

            $.each(data.items, function (i, item) {
                if (item != null) {
                    var QualityColor = "rgb(0, 228, 174)";
                    if (item.info.quality < 26) {
                        QualityColor = "rgb(13, 147, 131)";
                    } else if (item.info.quality > 25 && item.info.quality < 51) {
                        QualityColor = "rgb(7, 190, 155)";
                    } else if (item.info.quality >= 50) {
                        QualityColor = "rgb(0, 228, 174)";
                    }

                    if (item.info.expire != null) {
                        const ConvertTime = 60 * 24 * item.info.expire;
                        const Time = 60 * ConvertTime;
                        let StartDate = new Date(item.info.date).getTime()
                        item.info.quality = 100 - ((((Date.now() / 1000) - (StartDate + 3600)) / Time) * 100)
                        qualityLabel = item.info.quality;
                        if (item.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (item.info.quality <= 0.0) {
                            item.info.quality = 0;
                            qualityLabel = "";
                        }
                        if (item.info.quality > 0 && item.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (item.info.quality > 5 && item.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        var ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div>';
                        TimeDurability = item.info.quality
                        QualityData = item;
                    } else {
                        qualityLabel = "";
                        if (item.info.quality !== undefined) {
                            qualityLabel = item.info.quality;
                        }
                        if (item.info.quality >= 98.0) {
                            qualityLabel = "";
                        }
                        if (item.info.quality <= 0.0) {
                            item.info.quality = 0;
                            qualityLabel = "";
                        }
                        if (item.info.quality > 0 && item.info.quality <= 5) {
                            qualityLabel = "";
                        }
                        if (item.info.quality > 5 && item.info.quality <= 10) {
                            qualityLabel = "";
                        }
                        ItemLabel = '<div class="item-slot-label"><p>' + item.label + '</p></div>';
                    }
                    if (item.slot == 41) {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>6<i class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"></p></div>' +
                                ItemLabel
                            );
                    } else {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"></p></div>' +
                                ItemLabel
                            );
                    }
                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function () {
                $(".z-hotbar-inventory").html("");
            });
        }
    }

    Inventory.UseItem = function (data) {
        $(".itembox-container").hide();
        $(".itembox-container").fadeIn(250);
        $("#itembox-action").html("<p>Used</p>");
        $("#itembox-label").html("<p>" + data.item.label + "</p>");
        $("#itembox-image").html('<div class="item-slot-img"><img src="images/' + data.item.image + '" alt="' + data.item.name + '" /></div>')
        setTimeout(function () {
            $(".itembox-container").fadeOut(250);
        }, 2000)
    };

    var itemBoxtimer = null;
    var requiredTimeout = null;

    Inventory.itemBox = function (data) {
        if (itemBoxtimer !== null) {
            clearTimeout(itemBoxtimer)
        }
        var type = "Used 1x"
        if (data.type == "add") {
            type = "Received " + data.amount + "x";
        } else if (data.type == "remove") {
            type = "Remove " + data.amount + "x";
        } else if (data.type == "holster") {
            type = "Holstered";
        } else if (data.type == "unholster") {
            type = "Unholstered";
        }
        var $itembox = $(".itembox-container.template").clone();
        $itembox.removeClass('template');
        $itembox.html(
            '<div id="itembox-action"><p>' +
            type +
            '</p></div><div id="itembox-label"><p>' +
            data.item.label +
            '</p></div><div class="item-slot-img"><img src="images/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        $(".itemboxes-container").prepend($itembox);
        $itembox.fadeIn(250);
        setTimeout(function () {
            $.when($itembox.fadeOut(300)).done(function () {
                $itembox.remove()
            });
        }, 3000);
    };

    Inventory.RequiredItem = function (data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout)
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function (index, item) {
                    var element = '<div class="requiredItem-box"><div id="requiredItem-action">Required</div><div id="requiredItem-label"><p>'
                        + item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="images/'
                        + item.image +
                        '" alt="'
                        + item.name +
                        '" /></div></div></div>'


                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function () {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100)
        }
    };

    Inventory.Clickables = function () {
        $('.cloth').find('img').off()
        $('.cloth').find('img').click(function () {
            $.post("http://qb-inventory/ChangeComponent", JSON.stringify({
                component: $(this).attr('id')
            }));
        })
    };
    Inventory.Cloth = function () {
        Inventory.Clickables();
        setTimeout(function () {
            $('.other-inventory').fadeOut(200)
            $('.other-inv-info').fadeOut(200)
            $('.cloth').fadeIn(20)
        }, 300);
    };
    isClothOpen = false;
    Inventory.Necessary = function () {
        $('.other-inventory').fadeIn(200)
        $('.other-inv-info').fadeIn(200)
        $('.cloth').fadeOut(0)
        $('#clothing-menu').off()
        $('#clothing-menu').click(function () {
            if (isClothOpen == false) {
                isClothOpen = true
                $.post("http://qb-inventory/OpenClothMenu", JSON.stringify({ delete: isClothOpen }));
            } else if (isClothOpen == true) {
                isClothOpen = false
                $.post("http://qb-inventory/OpenClothMenu", JSON.stringify({ delete: isClothOpen }));
                Inventory.Necessary()
            }
            $('.tooltip').remove()
        })
    };

    window.addEventListener('message', function (event) {
        switch (event.data.action) {
            case "cloth":
                Inventory.Cloth();
                break
            case "open":
                Inventory.Open(event.data);
                Inventory.Necessary();
                break;
            case "close":
                isClothOpen = false;
                Inventory.Close();
                break;
            case "update":
                Inventory.Update(event.data);
                break;
            case "itemBox":
                Inventory.itemBox(event.data);
                break;
            case "requiredItem":
                Inventory.RequiredItem(event.data);
                break;
            case "toggleHotbar":
                Inventory.ToggleHotbar(event.data);
                break;
            case "RobMoney":
                $(".inv-options-list").append('<center><div class="inv-option-rob" id="rob-money"><p>Steal Cash</p></div></center>');
                $("#rob-money").data('TargetId', event.data.TargetId);
                break;
        }
    });
})();

$(document).on('click', '#rob-money', function (e) {
    e.preventDefault();
    var TargetId = $(this).data('TargetId');
    $.post('http://qb-inventory/RobMoney', JSON.stringify({
        TargetId: TargetId
    }));
    $("#rob-money").remove();
});

document.getElementById("reset").onclick = function () {
    document.getElementById("item-amount").value = 0;
};



