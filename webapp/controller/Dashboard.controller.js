sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/viz/ui5/format/ChartFormatter'
], function (Controller, ChartFormatter) {
	"use strict";

	return Controller.extend("com.sap.incture.IMO_PM.controller.Dashboard", {

		onInit: function () {
			var that = this;
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});

		},
		routePatternMatched: function (oEvent) {
			var viewName = oEvent.getParameter("name");
			if (viewName === "dashboard") {
				this.initializeMaintenanceCostChart();
				this.initializePlantCapChart();
				this.initializeNotificationChart();
				this.initializeWorkOrderChart();
			}
		},
		initializeMaintenanceCostChart: function () {
			var oViz = this.getView().byId("vizFrameMaintenanceCost");
			var formatPattern = ChartFormatter.DefaultPattern;
			var oPopOver = this.getView().byId("PopOverMaintenanceCost");
			oPopOver.connect(oViz.getVizUid());
			oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
			var graphModel = this.getView().getModel("oDashboardGraphsModel");
			var graphDummyBar = [{
				"Name": "Labour Cost",
				"Cost": 40
			}, {
				"Name": "Spare Part Cost",
				"Cost": 60
			}, {
				"Name": "Non-stock Cost",
				"Cost": 50
			}, {
				"Name": "External Cost",
				"Cost": 80
			}];
			graphModel.setProperty("/dummyMainCostData", graphDummyBar);
			oViz.setModel(graphModel);
			oViz.setVizProperties({
				plotArea: {
					dataPointStyle: {
						"rules": [{
							"dataContext": {
								"Name": "Labour Cost"
							},
							"properties": {
								"color": "sapUiChartPaletteSemanticGoodLight1" //chart Color palatte names
							}
						}, {
							"dataContext": {
								"Name": "Spare Part Cost"
							},
							"properties": {
								"color": "sapUiChartPaletteQualitativeHue9"
							}
						}, {
							"dataContext": {
								"Name": "Non-stock Cost"
							},
							"properties": {
								"color": "sapUiChartPaletteSemanticBadLight3"
							}
						}, {
							"dataContext": {
								"Name": "External Cost"
							},
							"properties": {
								"color": "sapUiChartPaletteSemanticCriticalLight1"
							}
						}]
					},
					dataPointSize: {
						"max": 50, //set the width of bars 
						"min": 5
					}
				},
				valueAxis: {
					title: {
						text: "Cost (in percent)",
						visible: true
					},
					axisLine: {
						visible: true
					},
					"max": 100,
					"min": 0
				},
				categoryAxis: {
					title: {
						visible: false
					}
				},
				title: {
					visible: false
				},
				yAxis: { //set min and max value for yAxis
					scale: {
						fixedRange: true,
						minValue: 0,
						maxValue: 100
					}
				}
			});
		},
		initializePlantCapChart: function () {
			var oVizFrame = this.getView().byId("idVizFramePlantCap");
			var graphDummyRadar = [{
				"month": "Jan",
				"plantCapacity": 10,
				"woActualHours": 20
			}, {
				"month": "Feb",
				"plantCapacity": 20,
				"woActualHours": 20
			}, {
				"month": "Mar",
				"plantCapacity": 30,
				"woActualHours": 20
			}, {
				"month": "Apr",
				"plantCapacity": 20,
				"woActualHours": 10
			}, {
				"month": "May",
				"plantCapacity": 20,
				"woActualHours": 5
			}, {
				"month": "Jun",
				"plantCapacity": 40,
				"woActualHours": 30
			}, {
				"month": "Jul",
				"plantCapacity": 50,
				"woActualHours": 10
			}, {
				"month": "Aug",
				"plantCapacity": 60,
				"woActualHours": 40
			}, {
				"month": "Sep",
				"plantCapacity": 30,
				"woActualHours": 10
			}, {
				"month": "Oct",
				"plantCapacity": 30,
				"woActualHours": 20
			}, {
				"month": "Nov",
				"plantCapacity": 20,
				"woActualHours": 20
			}, {
				"month": "Dec",
				"plantCapacity": 40,
				"woActualHours": 30
			}];
			this.getView().getModel("oDashboardGraphsModel").setProperty("/graphDummy", graphDummyRadar);
			oVizFrame.setModel(this.getView().getModel("oDashboardGraphsModel"));
			var formatPattern = ChartFormatter.DefaultPattern;
			/*oVizFrame.setVizProperties({
                plotArea: {
                     dataPointStyle: {
                        "rules":
                        [
                            {
                                "dataContext": {"plantCapacity": ""},
                                "properties": {
                                    "color":"sapUiChartPaletteQualitativeHue1"
                                }
                            }
                        ],
                        "others":
                        {
                            "properties": {
                                 "color": "sapUiChartPaletteSemanticGoodLight1"
                            }
                        }
                    }
                },
                title: {
                    visible: false
                }
            });*/
			var oPopOver = this.getView().byId("idPopOverPlantCap");
			oPopOver.connect(oVizFrame.getVizUid());
			oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
		},
		initializeNotificationChart: function () {
			var oViz = this.getView().byId("idVizFrameNotification");
			var formatPattern = ChartFormatter.DefaultPattern;
			var oPopOver = this.getView().byId("idPopOverNotification");
			oPopOver.connect(oViz.getVizUid());
			oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
			var graphModel = this.getView().getModel("oDashboardGraphsModel");
			var graphDummyNotif = [{
				"month": "Jan",
				"notifCount": 30
			}, {
				"month": "Feb",
				"notifCount": 20
			}, {
				"month": "Mar",
				"notifCount": 55
			}, {
				"month": "Apr",
				"notifCount": 10
			}, {
				"month": "May",
				"notifCount": 25
			}, {
				"month": "Jun",
				"notifCount": 40
			}, {
				"month": "Jul",
				"notifCount": 35
			}, {
				"month": "Aug",
				"notifCount": 45
			}, {
				"month": "Sep",
				"notifCount": 30
			}, {
				"month": "Oct",
				"notifCount": 50
			}, {
				"month": "Nov",
				"notifCount": 15
			}, {
				"month": "Dec",
				"notifCount": 35
			}];
			var totNotif = 0;
			for (var i in graphDummyNotif) {
				totNotif += graphDummyNotif[i].notifCount;
			}
			var avgNotif = parseInt(totNotif / graphDummyNotif.length, 10);
			graphModel.setProperty("/dummyNotif", graphDummyNotif);
			graphModel.setProperty("/totalNotif", totNotif);
			graphModel.setProperty("/averageNotif", avgNotif);
			oViz.setModel(graphModel);
			oViz.setVizProperties({
				valueAxis: {
					title: {
						text: "Notification Count",
						visible: true
					},
					axisLine: {
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: false
					}
				},
				title: {
					visible: false
				},
				plotArea: {
					referenceLine: {
						line: {
							valueAxis: [{
								color: "#4cba6b",
								value: avgNotif,
								visible: true,
								size: 1,
								type: "dotted"
								/*label: {
									text: "Average: " + avgNotif,
									visible: true
								}*/
							}]
						}
					}

				}
			});
		},
		initializeWorkOrderChart: function () {
			var oViz = this.getView().byId("idVizFrameWorkOrder");
			var formatPattern = ChartFormatter.DefaultPattern;
			var oPopOver = this.getView().byId("idPopOverWorkOrder");
			oPopOver.connect(oViz.getVizUid());
			oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
			var graphModel = this.getView().getModel("oDashboardGraphsModel");
			var graphDummyWO = [{
				"month": "Jan",
				"woCount": 45
			}, {
				"month": "Feb",
				"woCount": 40
			}, {
				"month": "Mar",
				"woCount": 62
			}, {
				"month": "Apr",
				"woCount": 60
			}, {
				"month": "May",
				"woCount": 65
			}, {
				"month": "Jun",
				"woCount": 50
			}, {
				"month": "Jul",
				"woCount": 55
			}, {
				"month": "Aug",
				"woCount": 45
			}, {
				"month": "Sep",
				"woCount": 30
			}, {
				"month": "Oct",
				"woCount": 70
			}, {
				"month": "Nov",
				"woCount": 30
			}, {
				"month": "Dec",
				"woCount": 15
			}];
			var totWO = 0;
			for (var i in graphDummyWO) {
				totWO += graphDummyWO[i].woCount;
			}
			var avgWO = parseInt(totWO / graphDummyWO.length, 10);
			graphModel.setProperty("/dummyWO", graphDummyWO);
			graphModel.setProperty("/totalWO", totWO);
			graphModel.setProperty("/averageWO", avgWO);
			oViz.setModel(graphModel);
			oViz.setVizProperties({
				plotArea: {
					dataPointStyle: {
						"rules": [{
							"dataContext": {
								"month": "*"
							}, //not working
							"properties": {
								"color": "#e8743b" //demo purpose - set both colors same
							}
						}],
						"others": {
							"properties": {
								"color": "#e8743b" //demo purpose - set both colors same
							}
						}
					},
					referenceLine: {
						line: {
							valueAxis: [{
								color: "#4cba6b",
								value: avgWO,
								visible: true,
								size: 1,
								type: "dotted"
								/*label: {
									text: "Average: " + avgNotif,
									visible: true
								}*/
							}]
						}
					}
				},
				valueAxis: {
					title: {
						text: "Work Order Count",
						visible: true
					},
					axisLine: {
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: false
					}
				},
				title: {
					visible: false
				}
			});
		}
	});
});